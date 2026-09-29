# ARCHITECTURE.md

## Core

Responsible for:
* lifecycle
* game loop
* game state
* coordination of systems

## World

Responsible for:
* grid
* cells
* altitude
* objects
* world generation

## Player

Responsible for:
* position
* orientation
* movement
* interaction

## Rendering

Responsible exclusively for the visual representation of the game state.

## Input

Responsible for converting keyboard/mouse into commands.

## Entities

Will contain in the future:
* Sentinel
* Sentry
* Tree
* Boulder
* Clone