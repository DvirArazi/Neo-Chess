import { ObjectId } from "mongodb"
import { BoardLayout } from "shared/types/boardLayout"
import { GameRequest, Player, Timeframe } from "shared/types/game"
import { PieceColor } from "shared/types/piece"

export type UserViewData = {
  name: string,
  picture: string | undefined,
}

export type Friend = {
  id: ObjectId
} & UserViewData

export type GameTd = {
  id: ObjectId,
  layout: BoardLayout,
  timeframe: Timeframe,
  isRated: boolean,
  white: Player,
  black: Player,
  userColor: PieceColor,
  turnColor: PieceColor,
}

export type InvitationTd = {
  id: ObjectId,
  name: string,
  timeframe: Timeframe,
  isRated: boolean,
}

export type RequestTd = {
  timeframe: Timeframe,
  isRated: boolean,
}

export type GamesModalData = {
  ongoingGamesTd: GameTd[],
  invitationsTd: InvitationTd[],
  requestTd: RequestTd | null,
}

export type FriendRequest = {
  id: ObjectId,
  name: string,
  picture: string,
  email: string,
}

export type FriendsModalData = {
  friends: Friend[],
  friendRequests: FriendRequest[],
}