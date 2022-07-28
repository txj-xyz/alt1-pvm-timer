<div align="center">
<h1>PVM Kill Timer</h1>

<p>
	<img src="https://l.txj-dev.xyz/705tK"/>
</p>

Built on [alt1minimal](https://github.com/skillbert/alt1minimal/) forked from [alt1-jank-autosplitter](https://californ1a.github.io/alt1-jank-autosplitter/)

</div>

## User Installation

https://txj-xyz.github.io/alt1-pvm-timer/

To add to alt1, copy paste this full address:

    alt1://addapp/https://txj-xyz.github.io/alt1-pvm-timer/appconfig.json

Then hit the `Add App` button and open the newly added app.

## Usage

Upon opening the app, your chatbox should be highlighted to show that it is now watching for clue scroll solve messages.

Make sure you have timestamps enabled in your in-game chat. The app uses timestamps to make sure it doesn't split twice for the same kill timer. This can be done in the Settings under *Chat & Social* -> *Chat Customisation* -> *[Local timestamps in chat box](https://i.imgur.com/Tbry2Rp.png)*.

If using the old Node.js middleman script, you will need to:

1. Open LiveSplit, right-click it, go to `Control`, and hit `Start Server`.
2. Open the console, browse to the middleman script repo folder, and run `npm start`. It should say `Connected!`

Right-click on your sealed clue, hover open the `Open` option, and hit alt+1 keybind to start the timer (both the in-app timer and the LiveSplit integration). Alternatively, click the `Start` button in the app which will do the same.

The in-app timer will not auto-end on your final split like LiveSplit will, so the `Stop` button can be used to stop the timer without clearing the times if you're using the in-app timer. The `Clear` button will reset both the in-app times and LiveSplit.