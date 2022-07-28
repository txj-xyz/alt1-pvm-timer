//alt1 base libs, provides all the commonly used methods for image matching and capture
//also gives your editor info about the window.alt1 api
import * as a1lib from "@alt1/base";
import ChatBoxReader from "@alt1/chatbox";

//tell webpack to add index.html and appconfig.json to output
require("!file-loader?name=[name].[ext]!./index.html");
require("!file-loader?name=[name].[ext]!./style.css");
require("!file-loader?name=[name].[ext]!./appconfig.json");
require("!file-loader?name=[name].[ext]!./settingsbutton2.png");
require("!file-loader?name=[name].[ext]!./Icon.png");


// const output = document.querySelector(".main");
const startBtn = document.querySelector(".nisbutton.start");
startBtn.addEventListener("click", startTimer);
const clearBtn = document.querySelector(".nisbutton.clear");
clearBtn.addEventListener("click", clear);
const settingsBtn = document.querySelector(".nissmallimagebutton.settings");
settingsBtn.addEventListener("click", openSettings);
const modal = document.getElementById("settingsModal");
const modalCloseBtn = document.getElementsByClassName("nisclosebutton")[0];
const timerEle = document.querySelector(".timer .time");
const splitsEle = document.querySelector(".splits");
const scrollBox = document.querySelector(".second");
const defaultButton = document.querySelector(".default");
let errorEle: HTMLElement = document.querySelector(".error");
const regexTimestampStr = "\\[\\d{2}:\\d{2}:\\d{2}\\]";
const regexStr = "You cast out your net";
let regex = new RegExp(`${regexTimestampStr} ${regexStr}`);
let chatboxInterval;
let timerAnim;

let splits = [];
let lastTime = (new Date()).getTime();
let startTime = 0;
let startDate = new Date();
let file;
let actions = 1;
let reader;

function closeSettings() {
	const settingsElements: any = document.querySelectorAll(".modal-content td:nth-child(even)");
	for (const {children:[setting]} of settingsElements) {
		console.log(setting.id, setting.value);
		if (setting.id === "regex") {
			regex = new RegExp(`${regexTimestampStr} ${setting.value}`);
		} else if (setting.id === "chat" && reader && reader.pos) {
			const chat = setting.value;
			const ls = localStorage.getItem("chat");
			if (chat !== null && chat !== "") {
				const main = reader.pos.mainbox;
				const box: any = JSON.parse(atob(chat));
				if (main.rect.x !== box.rect.x || main.rect.y !== box.rect.y) { // not the same box
					reader.pos.mainbox = box;
				}
			} else if (ls !== "" && ls !== null) {
				reader.pos.mainbox = JSON.parse(atob(ls));
			} else {
				//If multiple boxes are found, this will select the first, which should be the top-most chat box on the screen.
				reader.pos.mainbox = reader.pos.boxes[0];
			}
			showSelectedChat(reader.pos.mainbox);
		} else if (setting.id === "color") {
			const c = hexToRgb(setting.value);
			if (reader) {
				reader.readargs.colors[reader.readargs.colors.length-1] = a1lib.mixColor(c[0], c[1], c[2]);
			}
		}
		if (setting.type === "checkbox") {
			localStorage.setItem(setting.id, setting.checked);
		} else {
			localStorage.setItem(setting.id, setting.value);
		}
	}
	modal.style.display = "none";
}

defaultButton.addEventListener("click", () => {
	localStorage.clear();
	const settingsElements: any = document.querySelectorAll(".modal-content td:nth-child(even)");
	for (const {children:[setting]} of settingsElements) {
		if (setting.id === "regex") {
			setting.value = regexStr;
			regex = new RegExp(`${regexTimestampStr} ${setting.value}`);
		} else if (setting.id === "chat") {
			setting.value = "";
			if (reader && reader.pos) {
				reader.pos.mainbox = reader.pos.boxes[0];
				showSelectedChat(reader.pos.mainbox);
			}
		} else if (setting.id === "timer-type") {
			setting.value = "overall";
			localStorage.setItem("timer-type", "overall");
		} else if (setting.id === "splitat") {
			setting.value = "1";
			localStorage.setItem("splitat", "1");
		} else if (setting.id === "color") {
			setting.value = "#00ff00";
			localStorage.setItem("color", "#00ff00");
		}
	}
});

modalCloseBtn.addEventListener("click", () => {
	closeSettings();
});

window.addEventListener("click", (event) => {
	if (event.target == modal) {
		closeSettings();
	}
});

errorEle.addEventListener("mouseenter", () => {
	if (errorEle.title) return;
	alt1.setTooltip(errorEle.ariaLabel);
});

errorEle.addEventListener("mouseleave", () => {
	if (errorEle.title) return;
	alt1.clearTooltip();
});

document.querySelector("#chat").addEventListener("change", (e: any) => {
	const value = e.target.value || localStorage.getItem("chat");
	if (value) {
		showSelectedChat(JSON.parse(atob(e.target.value)));
	} else {
		showSelectedChat(reader.pos.mainbox);
	}
});

function setValue(id: string, value: string) {
	const setting: HTMLInputElement = document.querySelector(`#${id}`);
	const ls = localStorage.getItem(id);
	if (ls === null || ls === "") {
		setting.value = value;
	} else {
		setting.value = ls;
	}
}

function openSettings() {
	modal.style.display = "flex";
	const regexEle: HTMLInputElement = document.querySelector("textarea#regex");
	if (!regexEle.value) {
		regexEle.value = regexStr;
	}

	setValue("timer-type", "overall");
	setValue("autostop", "50");
	setValue("splitat", "1");
	setValue("color", "#00ff00");

}

function setError(message) {
	if (!errorEle) {
		errorEle = document.createElement("span");
		errorEle.className = "error";
		timerEle.append(errorEle);
	}
	errorEle.style.display = "block";
	errorEle.ariaLabel = message;
	if (!window.alt1 || !window.alt1?.permissionPixel || !window.alt1?.permissionOverlay) {
		errorEle.title = message;
	}
}

function clearError() {
	if (!errorEle) return;
	errorEle.style.display = "none";
	errorEle.ariaLabel = "";
	if (!window.alt1) {
		errorEle.title = "";
	} else {
		alt1.clearTooltip();
	}
}

function onError(e: Error) {
	console.error(e);
}

function clear() {
	startBtn.innerHTML = "Start";
	cancelAnimationFrame(timerAnim);
	startTime = 0;
	startDate = new Date();
	actions = 1;
	splitsEle.innerHTML = "";
	timerEle.innerHTML = "0.<span class=\"miliseconds\">00</span>";
	splits = [];
}

function formatTime(value) {
	const seconds = (value / 1000) % 60;
	const minutes = Math.floor((value / (60 * 1000)) % 60);
	const hours = Math.floor((value / (60 * 60 * 1000)) % 24);
	const secondsS = (seconds < 10 && (minutes >= 1 || hours >= 1)) ? `0${seconds}`.slice(0, 5) : `${seconds.toFixed(2)}`;
	const [sec,mil] = secondsS.split(".");
	const minutesS = (minutes < 10 && hours >= 1) ? `0${minutes}`.slice(-2) : `${minutes}`.slice(-2);
	const hoursS = `${hours}`.slice(-2);

	if (hours < 1 && minutes < 1) {
		return `${sec}.<span class="miliseconds">${(mil)?mil:"00"}</span>`;
	}
	if (hours < 1) {
		return `${minutesS}:${sec}.<span class="miliseconds">${(mil)?mil:"00"}</span>`;
	}
	return `${hoursS}:${minutesS}:${sec}.<span class="miliseconds">${(mil)?mil:"00"}</span>`;
}

function showTime(value) {
	timerEle.innerHTML = formatTime(value);
}

function timer() {
	const currentTime = (new Date()).getTime();

	if (currentTime - lastTime >= 50) {

		lastTime = currentTime;
		// numSeconds++;
		// timerEle.innerHTML = `${numSeconds}`;
		if (localStorage.getItem("timer-type") === "single") {
			const previous = splits[splits.length - 1] || startTime;
			showTime(currentTime - previous);
		} else {
			showTime(currentTime - startTime);
		}
	}
	timerAnim = requestAnimationFrame(timer);
}

function split() {
	const currentTime = (new Date()).getTime();
	const previous = splits[splits.length - 1] || startTime;
	splits.push(currentTime);
	const msDuration = currentTime - startTime;
	const time = formatTime(msDuration);
	const segMsDur = currentTime - previous;
	const splitper = localStorage.getItem("splitat") || "1";
	const segmentTime = (previous)?formatTime(segMsDur):time;
	splitsEle.innerHTML += `<tr>
		<td>${actions}</td>
		<td>${segmentTime}</td>
		<td>${time}</td>
	</tr>`;
	scrollBox.scrollTo({
		top: scrollBox.scrollHeight,
		behavior: "smooth"
	});
	const as = localStorage.getItem("autostop");
	if (as !== "" || as !== null) {
		if (as !== "0" && as === actions.toString()) {
			startTimer();
		}
	}
}

function startTimer() {
	if (startTime !== 0) {
		clearInterval(chatboxInterval);
		startBtn.innerHTML = "Start";
		cancelAnimationFrame(timerAnim);
		startTime = 0;
		//timerEle.innerHTML = "0.<span class=\"miliseconds\">00</span>";
		return;
	}
	clear();
	startBtn.innerHTML = "Stop";
	startDate = new Date();
	startTime = startDate.getTime();
	requestAnimationFrame(timer);
}

function showSelectedChat(chat) {
	const appColor = a1lib.mixColor(0, 255, 0);
	//Attempt to show a temporary rectangle around the chatbox.  skip if overlay is not enabled.
	try {
		alt1.overLayRect(
			appColor,
			chat.rect.x,
			chat.rect.y,
			chat.rect.width,
			chat.rect.height,
			2000,
			5
		);
	} catch (e) {
		console.error(e);
	 }
}

function capture() {
	if (!window.alt1) {
		setError("You need to run this page in alt1 to capture the screen");
		return;
	}
	if (!alt1.permissionPixel) {
		setError("Page is not installed as app or capture permission is not enabled");
		return;
	}

	reader = new ChatBoxReader();
	let c: any = localStorage.getItem("color");
	if (c) {
		c = hexToRgb(c);
	} else {
		c = [0, 255, 0];
	}
	reader.readargs = {
		colors: [
			a1lib.mixColor(255, 255, 255), //white
			a1lib.mixColor(c[0], c[1], c[2]), //green
			//A1lib.mixColor(255, 165, 0), //Scavenging comps
			//A1lib.mixColor(255, 0, 0), //Rare Mats
			//A1lib.mixColor(67, 188, 188), //Ancient component
		],
	};

	try {
		reader.find(); //Find the chat box.
		reader.read(); //Get the initial read, to not report on initial load.
	} catch (e) {
		console.error(e);
		setError("Failed to capture RS");
		return;
	}
	//Find all visible chatboxes on screen
	// reader.find();
	// reader.read();
	let findChat = setInterval(() => {
		if (reader.pos === null) {
			setError("Looking for chatbox");
			reader.find();
		}
		else {
			clearInterval(findChat);
			clearError();
			reader.pos.boxes.map((box, i) => {
				const chat = document.querySelector("#chat");
				const value = btoa(JSON.stringify(box));
				chat.innerHTML += `<option value=${value}>Chat ${i}</option>`;
			});
			const chat = localStorage.getItem("chat");
			if (chat !== null && chat !== "") {
				reader.pos.mainbox = reader.pos.boxes[+chat];
			} else {
				//If multiple boxes are found, this will select the first, which should be the top-most chat box on the screen.
				reader.pos.mainbox = reader.pos.boxes[0];
			}
			// console.log(reader);
			showSelectedChat(reader.pos.mainbox);
			chatboxInterval = setInterval(() => {
				readChatbox();
			}, 500);
		}
	}, 1000);

	let timestamps = new Set();

	function readChatbox() {
		const opts = reader.read() || [];
		let chat = "";

		if (opts.length === 0) return;

		// console.log(opts);

		for (let a in opts) {
			chat += opts[a].text + " ";
		}

		if (chat.trim().match(/^\[\d{2}:\d{2}:\d{2}\]$/g)) return;

		// console.log(chat);

		const killComplete = chat.match(regex);
		if (!(killComplete != null && killComplete.length > -1)) return;

		console.log(killComplete);
		const timestamp = killComplete[0].match(/(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})/);
		if (!(startTime !== 0 && timestamp != null && timestamp.length > -1)) return;

		if (timestamps.has(timestamp[0])) {
			return console.log("Duplicate timestamp");
		}

		const time = new Date(
			startDate.getFullYear(),
			startDate.getMonth(),
			startDate.getDate(),
			+timestamp.groups.hour,
			+timestamp.groups.minute,
			+timestamp.groups.second
		);
		if (time.getTime() < startTime) {
			return console.log("Kill too early");
		}

		const ls = localStorage.getItem("splitat") || "1";
		if (actions % parseInt(ls, 10) === 0) {
			timestamps.add(timestamp[0]);
			console.log("SPLIT!");
			split();
		}
		actions++;
	}
}

function truncate(fs) {
	fs.createWriter((fileWriter) => {
		fileWriter.truncate(0);
	}, onError);
}

function setFile(fs) {
	truncate(fs);
	file = fs;
}

function hexToRgb(hex) {
	return hex.match(/[A-Za-z0-9]{2}/g).map((v) => parseInt(v, 16));
}

//check if we are running inside alt1 by checking if the alt1 global exists
if (window.alt1) {
	//tell alt1 about the app
	//this makes alt1 show the add app button when running inside the embedded browser
	//also updates app settings if they are changed
	alt1.identifyAppUrl("./appconfig.json");
	if (!alt1.permissionPixel) {
		setError("Page is not installed as app or capture permission is not enabled");
	}
}

document.addEventListener("readystatechange", () => {
	if (document.readyState === "complete") {
		const color = localStorage.getItem("color");
		if (color === "" || color === null) {
			localStorage.setItem("color", "#00ff00");
		}
		const autostop = localStorage.getItem("autostop");
		if (autostop === "" || autostop === null) {
			localStorage.setItem("autostop", "50");
		}
		const splitat = localStorage.getItem("splitat");
		if (splitat === "" || splitat === null) {
			localStorage.setItem("splitat", "1");
		}

		capture();
	}
}, false);