# Sessions & Games

Hello there! You're probably here because you want to join a session/game with your friend. Well I won't sludge down a t-bone steak unless you want to but here's a quick command to help you take off real quick:

`/join @friendsNameHere`

That's it! Just follow the instructions for whatever your using. For everyone else, here is an in-depth manual on how this whole thing works:

## As we were saying...

Lemonbot features some brand new technolgy to help you create and join games with your friends! Internally, we call these `stateful` commands (I swear though I've misspelled it everywhere across the code and these documents XP)

For discord folks, what matters is that there are many ways to jump into an activity with friends, this will help break down all the ways on doing that! If you're a nerd like me, you can check how this all works behind the scenes by checking the `./stateful` folder found in the code. It features a small readme and sample code to help you get started making these yourself.

## ways to connect to your session:

There are three types of data used to find your friends game or session:

1. passcode
2. Player's name
3. name of the command

Depending on how you search for a session, you can use any one of these values, or a combinatation of some of them. Now, below are methods to combine some of these clues:

## @lemonBot

@mentioning lemonbot is the easiest way to join friends and making subsequent actions. (like placing a number down in tic-tac-toe). Example: `@lemonBot @friendsName`

This syntax is special because you can also use it to progress a session. For example in hangman you can use it to guess the next letter:

`@lemonBot a`

In mastermind and other games before starting it can be used to set up a game:

`@lemonBot rnd`

## original command

The command related to a session can also be used to join or progress it. Just like `@lemonBot`, it will help you naviate the session, but the main difference is that it will help you switch between multiple sessions!
For example, if you're playing tic-tac-toe but also hosting a game of mastermind, you can swap between the two by simply using their respective commands (/tttoe and /mmind).

## /join

This command is specific to connecting you with your friends; it takes two of the three options for finding the session: `/join @friendsName`, `/join @friendsName diu156`, syntax like that.

## /leave

The opposite of /join! It takes in the same clues as /join as well. Essentially takes you out of a session. Some sessions will end if you are the host. Tic-tac-toe however will stay on.

# Switching between multiple sessions at once

Lemonbot allows users to do many things at once, including more than one of the same item! Let's say you host a game of tic-tac-toe

`/tttoe`

You can then start another by adding `create` to the command!

`/tttoe create`

To swap between them, you will need to put the passcode in before using the command:

`/tttoe abcdef 1` -> switches to the other game and puts your piece down on slot 1.

You can also use your friend's names instead of a passcode. If you're hosting a game, and sally also is, just use:

`/tttoe @sally`

Orrrrrr:

`@lemonBot @sally`

# Quick start your commands!

If you want to save a few steps before igniting a command, you can place your parameters in before the session even starts! For example:

`/hangman rnd` immediately starts a randomized game of hangman!

This should also work with joining commands:

`/tttoe @friendsName 2` should place a marker down on the second square of tic-tac-toe as soon as you join your buddy!

# Check if your command has a help page!

Some commands have help pages you can launch while in-game. They have much more information and tell you how to operate a game, and help to un-confuse new players. Usually they will mention if a help page is available when the command starts, so keep your eyes peeled!