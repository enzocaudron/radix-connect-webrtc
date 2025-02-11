import type { Subject } from 'rxjs'
import { Subscription, tap } from 'rxjs'
import type { Logger } from 'tslog'
import { parseJSON } from '../../utils'
import { toBuffer } from '../../utils/to-buffer'
import type { WebRtcSubjectsType } from './subjects'
import { stringify } from '../../utils/stringify'
import { handleIncomingChunkedMessages } from './helpers/handle-incoming-chunked-messages'
import type { ChunkedMessageType, Message } from '../_types'

export const DataChannelClient = (input: {
  dataChannel: RTCDataChannel
  logger?: Logger<unknown>
  subjects: WebRtcSubjectsType
  onDataChannelMessageSubject: Subject<ChunkedMessageType>
  sendMessageOverDataChannelSubject: Subject<string>
  onMessage: Subject<Message>
}) => {
  const logger = input.logger
  const dataChannel = input.dataChannel
  const subjects = input.subjects

  const onDataChannelOpen = () => {
    logger?.debug(`🕸🟢 data channel open`)
    subjects.dataChannelStatusSubject.next('open')
  }

  const onDataChannelClose = () => {
    logger?.debug(`🕸🔴 data channel closed`)
    subjects.dataChannelStatusSubject.next('closed')
  }

  const onDataChannelMessage = (event: MessageEvent<ArrayBuffer | string>) => {
    // webRTC clients are sending data in different formats
    parseJSON<ChunkedMessageType>(toBuffer(event.data).toString('utf-8'))
      .map((message) => {
        logger?.debug(`🕸💬⬇️ received data channel message`, message)
        return input.onDataChannelMessageSubject.next(message)
      })
      .mapErr((err) => {
        logger?.debug(`🕸💬⬇️ received data channel message`, err)
      })
  }

  const onDataChannelError = () => {
    logger?.debug(`🕸❌ data channel error`)
  }

  dataChannel.onopen = onDataChannelOpen
  dataChannel.onclose = onDataChannelClose
  dataChannel.onmessage = onDataChannelMessage
  dataChannel.onerror = onDataChannelError

  const sendMessageOverDataChannel = (message: string) => {
    logger?.debug(`🕸💬⬆️ sendMessageOverDataChannel`, message)
    dataChannel.send(message)
  }

  const sendConfirmationMessage = (messageId: string) => {
    stringify({
      packageType: 'receiveMessageConfirmation',
      messageId,
    }).map(sendMessageOverDataChannel)
  }

  const sendErrorMessage = (messageId: string) => {
    stringify({
      packageType: 'receiveMessageError',
      messageId,
      error: 'messageHashesMismatch',
    }).map(sendMessageOverDataChannel)
  }

  const subscriptions = new Subscription()

  subscriptions.add(
    input.sendMessageOverDataChannelSubject
      .pipe(tap(sendMessageOverDataChannel))
      .subscribe(),
  )

  subscriptions.add(
    handleIncomingChunkedMessages(input.onDataChannelMessageSubject)
      .pipe(
        tap((result) =>
          result
            .map(({ messageId, message }) => {
              sendConfirmationMessage(messageId)
              input.onMessage.next(message)
            })
            .mapErr(sendErrorMessage),
        ),
      )
      .subscribe(),
  )

  return {
    subjects,
    destroy: () => {
      dataChannel.removeEventListener('message', onDataChannelMessage)
      dataChannel.removeEventListener('open', onDataChannelOpen)
      dataChannel.removeEventListener('close', onDataChannelClose)
      subscriptions.unsubscribe()
    },
  }
}
