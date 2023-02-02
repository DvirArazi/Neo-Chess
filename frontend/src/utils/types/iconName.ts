export type IconName = 
  "approve" |
  "board" |
  "chessBishopBlack" |
  "chessBishopWhite" |
  "chessKingBlack" |
  "chessKingWhite" |
  "chessKnightBlack" |
  "chessKnightWhite" |
  "chessPawnBlack" |
  "chessPawnWhite" |
  "chessQueenBlack" |
  "chessQueenWhite" |
  "chessRookBlack" |
  "chessRookWhite" |
  "delete" |
  "deny" |
  "draw" |
  "fight" |
  "flip" |
  "friends" |
  "history" |
  "infinity" |
  "logo" |
  "menu" |
  "navigateLeft" |
  "navigateRight" |
  "pause" |
  "person" |
  "play" |
  "plus" |
  "rematch" |
  "resign" |
  "share" |
  "signOut" |
  "swords" |
  "takeback" |
  "user" |
  "wifi" |
  "wifiOff";

export function iconNameToPath(name: IconName) {
  switch(name) {
    case "approve": return "approve";
    case "board": return "board";
    case "chessBishopBlack": return "chess/bishop_black";
    case "chessBishopWhite": return "chess/bishop_white";
    case "chessKingBlack": return "chess/king_black";
    case "chessKingWhite": return "chess/king_white";
    case "chessKnightBlack": return "chess/knight_black";
    case "chessKnightWhite": return "chess/knight_white";
    case "chessPawnBlack": return "chess/pawn_black";
    case "chessPawnWhite": return "chess/pawn_white";
    case "chessQueenBlack": return "chess/queen_black";
    case "chessQueenWhite": return "chess/queen_white";
    case "chessRookBlack": return "chess/rook_black";
    case "chessRookWhite": return "chess/rook_white";
    case "delete": return "delete";
    case "deny": return "deny";
    case "draw": return "draw";
    case "fight": return "fight";
    case "flip": return "flip";
    case "friends": return "friends";
    case "history": return "history";
    case "infinity": return "infinity";
    case "logo": return "logo";
    case "menu": return "menu";
    case "navigateLeft": return "navigate_left";
    case "navigateRight": return "navigate_right";
    case "pause": return "pause";
    case "person": return "person";
    case "play": return "play";
    case "plus": return "plus";
    case "rematch": return "rematch";
    case "resign": return "resign";
    case "share": return "share";
    case "signOut": return "sign_out";
    case "swords": return "swords";
    case "takeback": return "takeback";
    case "user": return "user";
    case "wifi": return "wifi";
    case "wifiOff": return "wifi_off";
  }
}
