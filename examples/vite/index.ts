import { hello } from './hello.rpc'

const gen = await hello(undefined)
const writable = gen.pipeTo(
  new WritableStream({
    abort(reason) {
      const element = document.createElement('div')
      element.textContent = `aborted: ${reason}`
      document.querySelector('#view')?.appendChild(element)
    },
    close() {
      const element = document.createElement('div')
      element.textContent = 'closed'
      document.querySelector('#view')?.appendChild(element)
    },
    start() {
      const element = document.createElement('div')
      element.textContent = 'started'
      document.querySelector('#view')?.appendChild(element)
    },
    write(chunk) {
      const element = document.createElement('div')
      element.textContent = chunk.data
      document.querySelector('#view')?.appendChild(element)
    },
  }),
)
