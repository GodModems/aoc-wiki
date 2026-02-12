# Standard Chess Rules

This page covers the rules of Age of Chesspires (win conditions, turn structure, special rules, and endings).  

<br>
---

## Game Setup
The board is a standard 8x8 chessboard and follows the a-h, 1-8 labeling convention with white starting on the 1st rank and black on the 8th.

By default each side is given a 10:00 minute timer that increments 10 seconds after each turn. 

Before the match begins, 3 [research](#/research/index) cards are shown and players are given 30 seconds to vote. By default the [Dark Age](#/research/dark-age) card is chosen and no special rules are added to the match.

<br>
---

## Basic turn rules
Players alternate turns, starting with White.
On your turn you make **one legal move**.
You must play a move that does **not** leave your [Royal](#/pieces/index#royals) in check.
##### Note
- The [Emperor](#/pieces/emperor) may be placed into check.

<br>
---

## Check
A [Royal](#/pieces/index#royals) is in **check** if it is under attack by one or more enemy [pieces](#/pieces/index).
You may not end your turn with your [Royal](#/pieces/index#royals) in check.

<br>
---

## Game Ending Conditions

<br>

### Win/Lose Conditions
These conditions result in one side winning the match and the other losing, often resulting in siginficant elo gains/losses for each respective player.
<br>

#### Resignation
A player may at any point during the match choose to resign, forfitting the match. This results in a loss for the resigning player.

<br>

#### Checkmate
A Checkmate occurs when a players [Royal](#/pieces/index#royals) is in check and there is **no legal move** that removes the check.
##### Note
- Unless altered by a special rule such as the [French](#/civilizations/french) or [Emergency Coronations](#/research/emergency-coronations), This will result in the checkmated side losing the match.

<br>

#### Regicide
Regicide is a special occurance where a players [Royal](#/pieces/index#royals) is captured due to the inclusion of special rules such as the [Chinese](#/civilizations/chinese) or [Emergency Coronations](#/research/emergency-coronations).
This results in a loss for the player who no longer has an active [Royal](#/pieces/index#royals) piece.

#### Expired Clock
If a player runs out of time on their clock, they immediately lose the match.
<br>
<br>

### Draws
A draw usually results in very low (if not 0) elo gains/losses for both players. Draws typically occur when the game is no longer progressing.

<br>

#### Agreement
Players may agree to a draw at any time.

<br>

#### Threefold repetition
If the exact same board state occurs three times the game will end in a draw automatically.

<br>

#### 50-move rule
If **50** consecutive moves occur without either:
- Any [minor piece](#/pieces/index#minor) making an advancing move
- Any capture
The game ends in a draw automatically.

<br>

#### Insufficient material
If neither side can possibly checkmate by any sequence of legal moves, the game ends in a draw automatically. Common cases:
- [Royal](#/pieces/index#royals) vs [Royal](#/pieces/index#royals)
- [Royal](#/pieces/index#royals) + [bishop](#/pieces/bishop) vs [Royal](#/pieces/index#royals)
- [Royal](#/pieces/index#royals) + [knight](#/pieces/knight) vs [Royal](#/pieces/index#royals)
- [Royal](#/pieces/index#royals) + [bishop](#/pieces/bishop) vs [Royal](#/pieces/index#royals) + [bishop](#/pieces/bishop) with the [bishops](#/pieces/bishop) on the same color square.

<br>

#### Stalemate
**Stalemate** occurs when:
- The player to move is **not** in check, and
- The player has **no legal moves**


<br>
---



## Capturing
- Capturing is done by moving a [piece](#/pieces/index) onto a square occupied by an enemy [piece](#/pieces/index) (as allowed by that [piece's](#/pieces/index) capture rules).
- The captured [piece](#/pieces/index) is removed from the board.
- You cannot capture your own [pieces](#/pieces/index).

<br>
---

## Promotion
When a [minor piece](#/pieces/index#minor) reaches the farthest rank, it must be **promoted immediately** as part of the same move.
- The player chooses the promotion [piece](#/pieces/index). This [piece](#/pieces/index) can be any of your [civilizations](#/civilizations/index) [major pieces](#/pieces/index#major).
- Promotion is not limited by captured [piece](#/pieces/index) (you may have exceed your starting amounts).

<br>
---

## Castling 
Castling is a special move that moves the [Royal](#/pieces/index#royals) and one [rook](#/pieces/rook) on the same turn.

### How castling works
- The [Royal](#/pieces/index#royals) moves **two squares** toward a [rook](#/pieces/rook) on the same rank.
- That [rook](#/pieces/rook) then moves to the square the [Royal](#/pieces/index#royals) crossed over (landing next to the [Royal](#/pieces/index#royals)).

### Castling is legal only if all are true
- The [Royal](#/pieces/index#royals) and the chosen [rook](#/pieces/rook) have **not moved** earlier in the game and are on the same rank.
- All squares between the [Royal](#/pieces/index#royals) and that [rook](#/pieces/rook) are **empty**.
- The [Royal](#/pieces/index#royals) is **not currently in check**.
- The [Royal](#/pieces/index#royals) does **not pass through** a square that is under attack.
- The [Royal](#/pieces/index#royals) does **not end** on a square that is under attack.
- You have not already **Castled**.

##### Notes:
- It does not matter whether the [rook’s](#/pieces/rook) path is attacked; only the [Royal's](#/pieces/index#royals) start, transit, and destination squares matter.
- The [Emperor](#/pieces/emperor) can castle through and into a square that is under attack.

<br>
---

## En passant 
En passant is a special [minor piece](#/pieces/index#minor) capture.

### When it is available
- An enemy [minor piece](#/pieces/index#minor) moves **two squares forward** from its starting position, and
- It lands adjacent (on the same rank) to your [minor piece](#/pieces/index#minor).

### How it works
On your **very next move only**, your [minor piece](#/pieces/index#minor) may capture the enemies [minor piece](#/pieces/index#minor) **as if** the enemy pawn had moved only one square.
- Your [minor piece](#/pieces/index#minor) moves diagonally into the square the enemy [minor piece](#/pieces/index#minor) **passed through**.
- The enemy [minor piece](#/pieces/index#minor) is removed from the board.

##### Notes:
- If you do not capture en passant immediately on the next move, the option is lost.
- En passant must still be a legal move (it cannot leave your [King](#/pieces/king) in check).



