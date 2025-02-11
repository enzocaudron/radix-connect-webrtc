import type {
  IceCandidate,
  MessageSources,
  RemoteClientDisconnected,
  RemoteClientIsAlreadyConnected,
  RemoteClientJustConnected,
  SignalingServerResponse,
} from '@radixdlt/radix-connect-schemas'
import type { SignalingClientType } from './signaling/signaling-client'
import type { WebRtcClient } from './webrtc/webrtc-client'

export const remoteClientState = {
  remoteClientIsAlreadyConnected: 'remoteClientIsAlreadyConnected',
  remoteClientDisconnected: 'remoteClientDisconnected',
  remoteClientJustConnected: 'remoteClientJustConnected',
} as const

export const remoteClientConnected = new Set<string>([
  remoteClientState.remoteClientIsAlreadyConnected,
  remoteClientState.remoteClientJustConnected,
])

export const remoteClientDisconnected = new Set<string>([
  remoteClientState.remoteClientDisconnected,
])

export const isRemoteClientConnectionUpdate = (
  message: SignalingServerResponse,
): message is
  | RemoteClientJustConnected
  | RemoteClientIsAlreadyConnected
  | RemoteClientDisconnected =>
  remoteClientConnected.has(message.info) ||
  remoteClientDisconnected.has(message.info)

export type Dependencies = {
  secrets: Secrets
  signalingClient: SignalingClientType
  webRtcClient: WebRtcClient
  source: MessageSources
}

export type IceCandidateMessage = Pick<
  IceCandidate,
  'method' | 'payload' | 'source'
>

export type Message = Record<string, any>

export type Secrets = {
  encryptionKey: Buffer
  connectionId: Buffer
}

export type Status =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'disconnecting'

export type MetaData = {
  packageType: 'metaData'
  chunkCount: number
  hashOfMessage: string
  messageId: string
  messageByteCount: number
}

export type MessageChunk = {
  packageType: 'chunk'
  chunkIndex: number
  chunkData: string
  messageId: string
}

export type MessageConfirmation = {
  packageType: 'receiveMessageConfirmation'
  messageId: string
}

export const messageErrorReasons = {
  notConnected: 'notConnected',
  failedToSendMessage: 'failedToSendMessage',
  failedToPrepareMessage: 'failedToPrepareMessage',
  timeout: 'timeout',
} as const

export type MessageErrorReasons = keyof typeof messageErrorReasons

export type ChunkedMessageReceiveMessageError = {
  packageType: 'receiveMessageError'
  messageId: string
  error: MessageErrorReasons
}

export type MessageErrorTypes = ChunkedMessageReceiveMessageError

export type ChunkedMessageType =
  | MetaData
  | MessageChunk
  | MessageConfirmation
  | MessageErrorTypes

export type TurnServer = {
  urls: string
  username: string
  credential: string
}

export type StunServer = {
  urls: string
}

export type ConnectionConfig = {
  signalingServerBaseUrl: string
  turnServers?: TurnServer[]
}
