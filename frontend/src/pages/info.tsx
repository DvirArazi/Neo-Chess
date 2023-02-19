import { Box, Link } from "@mui/material";
import { isMobile } from "react-device-detect";

export default function Info() {
  return <Box sx={{
    fontFamily: `robotoslab`,
    padding: !isMobile ? `0 60px` : `0 20px`,
    display: `flex`,
    justifyContent: `center`,
    textAlign: `left`,
    lineHeight: `24px`,
  }}>
    <Box sx={{ maxWidth: `800px` }}>
      {getTitle('Rationale')}
      <Box>
        {'The aim of this variant is to slightly tweak the rules of Chess in order to reduce reliance on memorization, enhance the game\'s strategic depth, make the state of the game more discernible from a glance at the board, and eliminate redundant edge cases that don’t contribute to the enjoyment of the game, all while maintaining the essence and beauty of the original game.'}
      </Box>
      {getTitle('New Rules')}
      {getRuleParagraph(1,
        'Random board configuration for each game. Same as in Fischer Random, only the king doesn’t have to be between the two rooks.',
        'Randomizing the board at the beginning of each game eliminates the concept of opening theory, which in turn means players cannot depend on memorization and must instead rely on their creativity and ability to adapt to different positions. This can lead to new strategies and ideas being developed that would not have been possible in traditional chess.'
      )}
      {getRuleParagraph(2,
        'Stalemate is a win for the stalemating side.',
        'The current rule of stalemate often leads to players aiming for a draw by creating positions where their opponent cannot make a legal move. This can result in passive play and uninteresting games. Allowing the stalemating side to win would encourage more active play and make the game more exciting. Additionally, changing this rule would make the game even simpler, as declaring stalemate a win is a more intuitive extension of the rules. After all, the objective of the game is to capture the opponent\'s king, so when the opponent has no legal move left and their king is about to be captured no matter what, it is only natural that they should lose.'
      )}
      {getRuleParagraph(3,
        'Pawns can promote only to previously captured pieces. If no pieces were captured before the pawn reached the top rank, it cannot be promoted.',
        'This serves two purposes. Firstly, it adds a strategic dimension to the promotion process, as the default choice of promoting to a queen may not always be available. Players must consider which captured piece would best complement their position. Secondly, it eliminates the issue in traditional chess where players may run out of physical pieces, usually queens, to promote their pawns to. With this rule, it is impossible to reach such a situation as players can only promote their pawns to pieces that have been captured earlier in the game.'
      )}
      {getRuleParagraph(4,
        'No castling.',
        'Castling often leads to more static positions in the early game, with players castling and waiting to see what their opponent does next. Without castling, players would be more likely to move their king to safety in a more dynamic way, leading to more active and interesting positions. Furthermore, eliminating castling simplifies the game as it is an edgecase rule that does not flow naturally from the game\'s other rules. It would also reduce ambiguity when surveying the board, as players won’t need to recall whether their king or rooks have previously moved or not.'
      )}
      {getRuleParagraph(5,
        'No en passant.',
        'Similar to castling, en passant is also an edgecase rule that does not flow naturally from the game\'s other rules. It would also reduce ambiguity when surveying the board, the state of the game would be more discernible from looking at the board alone as it would no longer matter whether a pawn had moved past a pawn of the opponent on the previous move or some moves beforehand.'
      )}
      {getRuleParagraph(6,
        'No checks. A player may choose to place or leave their king in danger.',
        'The inclusion of checks provides no strategic depth to the game. Players must protect their king from danger to not lose the game anyway, so it\'s redundant to enforce it with a rule.'
      )}
      <Box sx={{ textAlign: `center` }}>
        {getTitle('Credit')}
        <Box>{'Neo-chess was designed and developed by Dvir Arazi'}</Box>
        <Link href="https://github.com/DvirArazi/Neo-Chess">{'https://github.com/DvirArazi/Neo-Chess'}</Link>
      </Box>
      <Box sx={{ height: `100px` }} />
    </Box>
  </Box>
}

function getRuleParagraph(number: number, title: string, text: string) {
  return <Box sx={{
    display: `flex`,
  }}>
    <Box sx={{
      // background: `blue`,
      fontWeight: `bold`,
      minWidth: `30px`,
      fontSize: `20px`,

    }}>{number + `.`}</Box>
    <Box>
      <Box sx={{ fontWeight: `bold` }}>{title}</Box>
      <Box sx={{ height: `5px` }}></Box>
      <Box>{text}</Box>
      <Box sx={{ minHeight: `25px` }} />
    </Box>
  </Box>
}

function getTitle(text: string) {
  return <>
    <Box sx={{ height: `40px` }} />
    <Box sx={{
      fontSize: `38px`,
      textAlign: `center`
    }}>
      {text}
    </Box>
    <Box sx={{ height: `30px` }} />
  </>
}