import { ObjectId } from "mongodb"

export type UserViewData = {
  name: string,
  picture: string | undefined,
}

export type Friend = {
  id: ObjectId
} & UserViewData