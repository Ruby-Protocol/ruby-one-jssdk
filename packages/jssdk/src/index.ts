import { EventEmitter } from 'eventemitter3'
import * as icons from './icons'

enum LoadStatus {
  Pending = 1,
  Ready = 2,
  Failed = 3
}

enum MessageType {
  Event = 1,
  Result = 2,
  Query = 3
}

enum MessageStatus {
  Success = 1,
  Error = 2
}

interface MessageData {
  taskId: number
  result: any
  type: MessageType
  status: MessageStatus
}

function buildDOM(url: string) {
  const container = document.createElement('div')
  container.className = 'rubyone__container'
  const mask = document.createElement('div')
  mask.className = 'rubyone__mask'
  const box = document.createElement('div')
  box.className = 'rubyone__box'
  const header = document.createElement('div')
  header.className = 'rubyone__header'
  const title = document.createElement('span')
  title.textContent = 'Ruby Wallet'
  const closeBtn = document.createElement('img')
  closeBtn.src = icons.Close
  closeBtn.className = 'rubyone__close'
  header.append(title, closeBtn)
  const iframe = document.createElement('iframe')
  iframe.className = 'rubyone__iframe'
  iframe.src = url
  box.append(header, iframe)
  container.append(mask, box)
  const iconWrap = document.createElement('div')
  iconWrap.className = 'rubyone__icon'
  iconWrap.title = 'Ruby Wallet'
  const iconImg = document.createElement('img')
  iconImg.src = icons.Logo
  iconWrap.appendChild(iconImg)
  return {
    container,
    iframe,
    closeBtn,
    iconWrap
  }
}

export interface Eip1193Provider {
  request(request: {
    method: string
    params?: Array<any> | Record<string, any>
  }): Promise<any>
}

export class RubyOneProvider extends EventEmitter implements Eip1193Provider {
  private taskId = 0
  private loadStatus = LoadStatus.Pending
  private available = false
  private invokes = new Map()
  private origin: string
  private container: HTMLDivElement
  private iframe: HTMLIFrameElement
  private closeBtn: HTMLImageElement
  private iconWrap: HTMLDivElement
  private dragging = false
  private clickPrevented = false
  private lastMousePosition = { x: 0, y: 0 }
  isMetaMask = false
  isRubyWallet = true

  constructor(private url?: string) {
    super()
    this.url = url || 'https://ruby.one'
    this.origin = new URL(this.url).origin
    const { container, iframe, closeBtn, iconWrap } = buildDOM(this.url)
    this.container = container
    this.iframe = iframe
    this.closeBtn = closeBtn
    this.iconWrap = iconWrap
    this.iframe.addEventListener('load', () => {
      document.body.appendChild(iconWrap)
      this.loadStatus = LoadStatus.Ready
      this.emit('LoadFinished')
    })
    this.iframe.addEventListener('error', () => {
      this.loadStatus = LoadStatus.Failed
      this.emit('LoadFinished')
    })
    this.closeBtn.onclick = () => {
      this.rejectAll()
      this.hide()
    }
    this.iconWrap.onclick = (event: MouseEvent) => {
      if (this.clickPrevented) {
        event.stopPropagation()
        this.clickPrevented = false
        return
      }
      this.show()
    }
    this.iconWrap.addEventListener('mousedown', this.onMouseDown.bind(this))
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('mouseup', this.onMouseUp.bind(this))
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(container)
    })
    this.listen()
  }

  private onMouseMove(event: MouseEvent) {
    if (this.dragging) {
      event.stopPropagation()
      event.preventDefault()
      this.clickPrevented = true
      const deltaX = event.clientX - this.lastMousePosition.x
      const deltaY = event.clientY - this.lastMousePosition.y
      const newLeft = Math.min(
        Math.max(0, this.iconWrap.offsetLeft + deltaX),
        window.innerWidth - this.iconWrap.offsetWidth
      )
      const newTop = Math.min(
        Math.max(0, this.iconWrap.offsetTop + deltaY),
        window.innerHeight - this.iconWrap.offsetHeight
      )
      this.iconWrap.style.left = newLeft + 'px'
      this.iconWrap.style.top = newTop + 'px'
      this.lastMousePosition = { x: event.clientX, y: event.clientY }
    }
  }

  private onMouseDown = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    this.dragging = true
    this.lastMousePosition = { x: event.clientX, y: event.clientY }
  }

  private onMouseUp(event: MouseEvent) {
    if (this.dragging) {
      event.stopPropagation()
      event.preventDefault()
    }
    this.dragging = false
  }

  private show() {
    this.container.className = 'rubyone__container rubyone__visible'
  }

  private hide() {
    this.container.className = 'rubyone__container'
  }

  send(action: any) {
    const win = this.iframe.contentWindow
    win?.postMessage(action, this.origin)
  }

  private rejectAll() {
    this.send({
      method: 'ruby_close'
    })
  }

  private listen() {
    window.addEventListener('message', e => {
      if (e.origin !== this.origin) return
      const { type, status, taskId, result } = e.data as MessageData
      if (type === MessageType.Result || type === MessageType.Query) {
        const action = this.invokes.get(taskId)
        if (!action) return
        this.invokes.delete(taskId)
        if (status === MessageStatus.Success) {
          return action.resolve(result)
        } else {
          return action.reject(result.error)
        }
      }
      if (type === MessageType.Event) {
        switch (result.event) {
          case 'wallet_open':
            this.show()
            break
          case 'wallet_close':
            this.hide()
            break
          case 'available':
            this.available = true
            break
          default:
            this.emit(result.event, result.data)
        }
      }
    })
  }

  private async waitLoad() {
    if (this.available !== true) {
      await new Promise(resolve => {
        this.once('ready', resolve)
      })
      this.available = true
    }
    if (this.loadStatus === LoadStatus.Ready) return Promise.resolve(true)
    return Promise.reject(false)
  }

  private invoke(method: string, params: any[]) {
    return new Promise(async (resolve, reject) => {
      const action = {
        taskId: this.taskId++,
        method,
        params
      }
      this.invokes.set(action.taskId, {
        action,
        resolve,
        reject
      })
      this.waitLoad().then(() => {
        this.send(action)
      })
    })
  }

  async request(request: {
    method: string
    params?: any[] | Record<string, any>
  }): Promise<any> {
    const method = request.method
    const params = request.params as any
    if (params && params[0]?.input) {
      params[0].data = params[0].input
      delete params[0].input
    }
    const result: any = await this.invoke(method, params)
    return result
  }

  enable() {
    return this.request({
      method: 'eth_requestAccounts',
      params: []
    })
  }
}
