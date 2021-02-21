# States

"Stateful" commands are souped-up applications that are capable of remembering what the user (or multiple users) did last. This extra dimension allows for commands that otherwise wouldn't be possible by simply talking back to lemonbot. A theoritical example would be porting Zorg to discord. An implemented example would be one of the games built for lemonbot (e.g tic-tac-toe).

Commands of this type will look a little fractured due to the fact nothing is linear. Becuase of this it's up to the developer to create ways of knowing what information should come next in order to anticipate inpuvts and keep the command flowing.

states themselves are small objects in memory that save data from the last interaction. At minimum they contain a list of users interacting with it, the time it expires, it's passcode, among other details.

A state can be obtained through wide degrees of contexts. Users don't need to say a specific command, even if they have multiple states being interacted with at once. The simplest interaction is simply mentioning @lemonbot, and that's all that's needed to use the last state that was interacted with.

## Why a separate folder?

This feature of lemonbot doesn't really fit as a lemon module (something that can be used outside the bot) or part of corePieces (a single important file geared to lemonbot)

In general, this is very much a feature of it's own class in that it was designed for lemonbot in mind and will most likely be stuck in lemonbot (non-dynamic). There are too many things that depend on discord.js and more specifically how lemonbot was structured. Theoretically this could be ported to other bots using discord.js, but as of writing this I'm not sure if it's capable of doing that.

## Table of contents

* stateManager.js - object definitions and methods to swap contexts and allow others to join/leave states
* stateCommandInterface.js - contains things to setup lemonbot for taking in contexts
* games - Games broken down into small functions that use state system