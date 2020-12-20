# Admin Commands Manual

Lemonbot is capable of many commands. The admin commands specifically are different than standard commands however in that:

1. They have no cooldown
1. They are reserved only for the highest discord server rank "Administrator"

These commands are capable of destroying a server's message history if not careful, so to properly use them, make sure you have a practice environment where it won't cause major damage.

## Initial setup

To use these commands, you either need to be the server owner, or somehow have an administration rank either through individual member permissions or a "role". Be sure only to grant a role like this to individuals whom are trusted in the server, as once again these commands can cause destruction. Before installing lemonbot, please make sure everything is in place.

Non-admins will receive this message when launching an admin command:

`Sorry, it looks like only Admins can use this command!`

# Commands

## `/adminhelp`

If for some reason you can't find this document or need a quick set of tips, this command is here to provide quick descriptions of every command you see below. No special syntax is needed to use it.

## `/del` & `/move`


`/del` is capable of deleting up to 99 messages at one time (+1 for deleting the command itself). These messages can be filtered out by who sent it, as well as the contents.

Here are some examples of how to use it:

```
/del 10
```
Probably the simplest example, delete 10 messages starting with the most recent. Next:

```
/del @cottonEyeJoe 5
```
This reads slightly differently. Instead of directly being 5 messages, it now says "delete @cottonEyeJoe's messages within a 5 message range"

In other words, the number `5` is how far you want to search for things to delete. If there are `4` messages from @cottonEyeJoe from your range of 5, only those 4 will be removed.

Here's one more main example:
```
/del "blood" 20 "guns" @cottonEyeJoe "romance" @ironMouthSteve
```

"Zach; why in the world did you place a `20` and `@cottonEyeJoe` in the middle of the example?! That hits my OCD!" You ask? It will and it shall. >:)

Jokes aside this was to demonstrate you can place items anywhere in the command and it will still work. Since everything can be distinguished by some property (keywords having "quotations", numbers being numbers and mentions having @'s) it's easy to take it all in via strange fashion. This should help speed things up and that way you don't have to worry when in a rush.

Anyway, this reads as "within a 20 message range, remove messages from @cottonEyeJoe and @ironMouthSteve which have the keywords 'blood', 'guns' or 'romance'". Emphasis on **or**. Not all of these words need to be in the message to be removed, just one of them.

Good work, you know how to use `/del`! Ready for `/copy`?! It's a hefty one. You sure? Ok here it goes:

*PSYCHE* - it's the same patterns as `/del` XD

...almost

Really the only other piece to it is the *copying* aspect of it. Specifically, where you would like to place the messages you find:

```
/copy "blood" 20 "guns" @cottonEyeJoe "romance" @ironMouthSteve #westerns
```

That's literally it. The only different item is the target channel you wish to send items over to. Like the other items, the channel can be anywhere in the command. Keep in mind when copying messages, discord pings everyone accepting notifications about it, so perhaps do it small quantities so notifications aren't insane.

Well done! That's it for `/del` and `/copy`

## `/mute & /umute`

These are fairly simple to use. As emphasized by the names themselves, the commands' purposes are to mute and unmute voice channels.

Discord as far as I know doesn't have @mention syntax for voice channels, so the quotation mark syntax (`"channel name here"`) was recycled to list your channels to mute.

Also because of this, there really isn't a id-system in the event multiple channels have different names. This is a limitation I wasn't able to get around as of right now, which means you will need to have unique channel names for this to fully work.

Channel names also need to be stated in full. In the future I may try to remove this restriction.

Example usage:
```
/mute "saloon" "spagetti and meatballs" 2
```

Voice channels "saloon" and "spagetti and meatballs" will be muted for 2 minutes. If a number isn't provided, the default is 5.

You can also add a timestamp instead of a regular number so you can have hours, minutes and seconds.

All of these turn into valid timestamps:
```
two minutes, one second
/mute "saloon" 2:1

1 hour, 5 minutes and 3 seconds
/mute "saloon" 1:5:3

30 seconds
/mute "saloon" :30

90 minutes and 8 seconds
/mute "saloon" 90:08
```

For `/umute`, the syntax is the same but numbers aren't used

```
/umute "saloon"
```

This will unmute "saloon" before it's time is done. If there were any people manually server muted before launching the command they will also be unmuted.

**Important** - If anyone leaves the voice channel while the command is being enforced, they will remain server muted if they don't come back after the time is up for any channels. This also means they can be server-muted in one channel, but get unmuted if they visit another channel if that channel's mute time is about to run out.

## `/voisplit`

This is an interesting command, it takes everyone from a single voice channel, then splits everyone out into random groups depending on how many channels you add to the command.

Here's an example command:
```
/voisplit "saloon" "spagetti and meatballs" "city slickers"
```

Unlike the previous commands though, the order here matters. It reads like this: "Take everyone from 'saloon', and randomly place everybody into even groups that spread to 'saloon' spagetti and meatballs' and 'city slickers'"

Here's a visual example of the end result. Let's say you have 6 members in one channel

* `saloon`
    * @cottonEyeJoe
    * @ironMouthSteve
    * @RC Ace 95
    * @RylanStylin
    * @myBodyIsReady
    * @stitch
* `spagetti and meatballs`
* `city slickers`

Members would then be dispersed evenly, but you don't know who you will be paired with!

* `saloon`
    * @cottonEyeJoe
    * @RylanStylin
* `spagetti and meatballs`
    * @ironMouthSteve
    * @stitch
* `city slickers`
    * @RC Ace 95
    * @myBodyIsReady

The command is great for random match-making. If there's a odd-number of people there will be at least one extra member in one room. If there are fewer members than there are rooms specified, one member will go to a designated room.

## `/raid`

The wording for this command was sortof inspired by twitch. On twitch, a raid is a way to move all your viewers to another channel. A boost of viewership for that matter.

On lemonbot `/raid` moves everyone from one or more channels to a specific channel. I thought it would be a cooler name than /herd... baAaAaH.

Raid syntax looks like this:

```
/raid "spagetti and meatballs" "city slickers" "saloon"
```

It reads: "Take everyone from 'spagetti and meatballs' and 'city slickers' and place them all in 'saloon'". Pretty straightforward.

This command is great for bringing everyone back from using `/voisplit`, or simply bringing everyone back to make an announcement or to watch an event together.
