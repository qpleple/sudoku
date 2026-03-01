# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A kid-friendly 4x4 Sudoku game built as a single-file HTML application (`index.html`). No build tools, dependencies, or tests — just open the file in a browser.

## Architecture

Everything lives in `index.html`: HTML structure, CSS styles, and vanilla JavaScript game logic. The game uses a 4x4 grid with 2x2 boxes and numbers 1-4, targeted at young children.

Key game functions:
- `generateSolution()` — backtracking solver that produces a random valid grid
- `generatePuzzle()` — removes 6 cells from a solution to create the puzzle
- `renderGrid()` / `renderNumberPad()` — DOM rendering
- `placeNumber()` — validates input against solution, shows error animation on wrong answers
- `checkWin()` — compares `userInput` against `solution`

## Known Bugs

There are index calculation bugs in the code — `updateCellHighlights()`, `placeNumber()`, and `checkWin()` use grid dimensions of 6 instead of 4 (likely remnants from an earlier 6x6 version). These should be fixed to use 4.
