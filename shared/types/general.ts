import { BoardLayout } from "shared/types/boardLayout"
import { GameStatus, Player, Timeframe } from "shared/types/game"
import { PieceColor } from "shared/types/piece"

export type UserViewData = {
  name: string,
  picture: string | undefined,
}

export type Friend = {
  id: string
} & UserViewData

export type GameTd = {
  path: string,
  layout: BoardLayout,
  timeframe: Timeframe,
  isRated: boolean,
  white: Player,
  black: Player,
  userColor: PieceColor,
  turnColor: PieceColor,
  status: GameStatus,
}

export type GameInvitation = {
  friendId: string,
  friendName: string,
  timeframe: Timeframe,
  isRated: boolean,
}

export type GameRequestTd = {
  timeframe: Timeframe,
  isRated: boolean,

} & (
    {
      isByRating: true,
      ratingAbsMin: number,
      ratingAbsMax: number,
    } |
    {
      isByRating: false,
      opponentName: string,
    }
  )

export type GamesModalData = {
  ongoingGamesTd: GameTd[],
  invitations: GameInvitation[],
  requestTd: GameRequestTd | null,
}

export type FriendRequest = {
  id: string,
  name: string,
  picture: string,
  email: string,
}

export type FriendsModalData = {
  friends: Friend[],
  friendRequests: FriendRequest[],
}