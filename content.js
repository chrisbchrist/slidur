//Append style tag for webfont
var styleNode = document.createElement("style");
styleNode.type = "text/css";
styleNode.textContent =
  "@font-face { font-family: 'Open Sans Condensed'; src: url('" +
  chrome.extension.getURL("lib/OpenSansCondensed-Light.ttf") +
  "'); }";
document.head.appendChild(styleNode);

class Slidur {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.interval = 3000;
    this.preloaded = [];
    this.timer;
    this.ticker;
    this.play = false;
  }

  getImages(hash) {
    return $.ajax({
      url: "https://api.imgur.com/3/album/" + hash + "/images",
      method: "GET",
      headers: {
        Authorization: "Client-ID 07a9a283b2003c0"
      }
    });
  }

  setImage(url) {
    const currentImg = document.getElementById("current-img");
    document.getElementById("current-vid").style.display = "none";
    currentImg.src = url;
    if (currentImg.style.display == "none") {
      currentImg.style.display = "block";
    }
  }

  setVideo(url) {
    const video = document.getElementById("current-vid");
    document.getElementById("current-img").style.display = "none";
    video.setAttribute("src", url);
    video.style.display = "block";
    video.load();
    video.play();
  }

  stopTimer() {
    if (this.timer) {
      this.togglePlay();
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex = this.currentIndex - 1;
      this.setImage(this.images[this.currentIndex]);
      this.updateProgress();
    }
  }

  nextSlide() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex = this.currentIndex + 1;
      const fileExtension = this.images[this.currentIndex].split(".").pop();
      if (fileExtension == "mp4") {
        this.setVideo(this.images[this.currentIndex]);
      } else {
        this.setImage(this.images[this.currentIndex]);
      }
      this.updateProgress();
    } else if (this.currentIndex == this.images.length - 1) {
      this.stopTimer();
    }
  }

  changeSlide() {}

  setInterval(newInterval) {
    this.stopTimer();
    this.interval = newInterval;
  }

  togglePlay() {
    const btnImg = this.timer
      ? chrome.extension.getURL("img/play-solid.svg")
      : chrome.extension.getURL("img/pause-solid.svg");
    if (!this.timer) {
      this.timer = setInterval(() => {
        if (this.ticker) {
          clearInterval(this.ticker);
        }
        const ticker = document.getElementById("ticker");
        this.ticker = setInterval(() => {
          ticker.style.width = ticker.style.width;
        }, this.interval / 100);
        this.nextSlide();
      }, this.interval);
    } else {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.getElementById("play-icon").src = btnImg;
  }

  updateProgress() {
    const ratio = ((this.currentIndex + 1) / this.images.length) * 100;
    document.getElementById("progress").style.width = ratio + "%";
  }

  remove() {
    this.stopTimer();

    this.images = [];
    this.currentIndex = 0;
    this.interval = 3000;
    this.preloaded = [];
    this.timer = null;
    this.play = false;
    const app = document.getElementById("app");
    document.body.removeChild(app);
  }
}

function preloadImages(currentIndex) {}

//Create start button at the top of the gallery container
const iconUrl = chrome.extension.getURL("img/slideshow-icon.svg");
const postHeader = document.getElementsByClassName("post-header")[0];
const startBtn = document.createElement("div");
startBtn.classList.add("slidur__start-btn");
startBtn.innerHTML =
  "<img class='slidur__icon' src='" + iconUrl + "'/>Slidur</div>";

//Get images from Imgur API, create HTML template and attach event listeners
startBtn.addEventListener("click", function() {
  let slidur = new Slidur();
  //Imgur galleries are preceded by 'gallery' or 'a' routes
  const currentUrl = window.location.href;
  const galleryHash =
    currentUrl.indexOf("gallery") > -1
      ? currentUrl.split("/gallery/")[1]
      : currentUrl.split("/a/")[1];

  slidur.getImages(galleryHash).done(function(response) {
    //Add images to slidur
    let imageLinks = [];
    for (let i = 0; i < response.data.length; i++) {
      let link = response.data[i].link;
      imageLinks.push(link);
      console.log(link);
    }
    slidur.images = imageLinks;

    //Create backdrop container
    const app = document.createElement("div");
    app.classList.add("slidur__app");
    app.id = "app";

    //Import icon URL's from extension
    const prevIcon = chrome.extension.getURL("img/chevron-left-solid.svg");
    const nextIcon = chrome.extension.getURL("img/chevron-right-solid.svg");
    const playIcon = chrome.extension.getURL("img/play-solid.svg");
    const intervalIcon = chrome.extension.getURL("img/clock-regular.svg");
    const checklIcon = chrome.extension.getURL("img/check-solid.svg");
    const xIcon = chrome.extension.getURL("img/times-solid.svg");

    app.innerHTML = `
    <div class="slidur__progress-wrapper">
    <div id="progress" class="slidur__progress"></div>
    </div>
    <div class="slidur__main">
    <div class="slidur__close" id="close">🞩</div>
    <div id="back" class="slidur__control slidur__control--back">
      <div class="slidur__arrow slidur__arrow-back">
        <img class="slidur__arrow-icon" src="${prevIcon}"/>
      </div>
    </div>
    <div class="slidur__slide-wrapper">
    <div class="slidur__ticker-wrapper"><div class="slidur__ticker" id="ticker"></div></div>
    <img id="current-img" class="slidur__current-img" src=${
      slidur.images[slidur.currentIndex]
    }/>
    <video controls id="current-vid" class="slidur__video">
    </video>
    </div>
    <div id="next" class="slidur__control slidur__control--next">
       <div class="slidur__arrow slidur__arrow-next">
       <img class="slidur__arrow-icon" src="${nextIcon}"/>
      </div>
    </div>
    <div class="slidur__actions">
      <div id="play-btn" class="slidur__play" tab-index="0"><img id="play-icon" class="slidur__icon--play" src="${playIcon}"/></div>
      <div class="slidur__interval-wrapper">
        <div class="slidur__interval-popup">
          <p class="slidur__interval-text">Enter time between slides in milliseconds (e.g. <strong>3000</strong>).</p>
          <input id="interval-input" type="text" class="slidur__interval-input" placeholder="Interval"/>
          <div class="slidur__popup-buttons">
            <button id="interval-confirm" class="slidur__popup-btn slidur__popup-btn--confirm">Change</button>
            <button id="interval-cancel" class="slidur__popup-btn slidur__popup-btn--cancel">Cancel</button>
          </div>
        </div>  
        <div class="slidur__change-interval" id="change-interval">
          <img class="slidur__icon--interval" src="${intervalIcon}"/>
          Change Interval
        </div>
      </div>
    </div>
    </div>
    `;
    document.body.appendChild(app);

    const fileType = slidur.images[0].split(".").pop();
    if (fileType == "mp4") {
      slidur.setVideo(slidur.images[0]);
    }

    slidur.updateProgress();

    //Attach event listeners
    document.getElementById("back").addEventListener("click", function() {
      slidur.prevSlide();
    });

    document.getElementById("next").addEventListener("click", function() {
      slidur.nextSlide();
    });

    document
      .getElementById("play-btn")
      .addEventListener("click", slidur.togglePlay.bind(slidur));

    document
      .getElementById("close")
      .addEventListener("click", slidur.remove.bind(slidur));

    document
      .getElementById("change-interval")
      .addEventListener("click", function() {
        document
          .getElementsByClassName("slidur__interval-wrapper")[0]
          .classList.add("slidur__interval-wrapper--open");
      });

    //Helper function for mouse/key events
    function changeInterval() {
      const newInterval = document.getElementById("interval-input").value;
      if (parseInt(newInterval) > 99 && parseInt(newInterval) < 60001) {
        slidur.setInterval(newInterval);
        document
          .getElementsByClassName("slidur__interval-wrapper")[0]
          .classList.remove("slidur__interval-wrapper--open");
      } else {
        alert("Please enter a value between 100 and 60000.");
      }
    }

    document
      .getElementById("interval-confirm")
      .addEventListener("click", changeInterval);

    document
      .getElementById("interval-input")
      .addEventListener("keydown", function(e) {
        if (e.which === 13) {
          changeInterval();
        }
      });

    document
      .getElementById("interval-cancel")
      .addEventListener("click", function() {
        document
          .getElementsByClassName("slidur__interval-wrapper")[0]
          .classList.remove("slidur__interval-wrapper--open");
      });

    //Use keyup as keypress does not work for escape in Chrome
    document.addEventListener("keyup", function(e) {
      if (e.keyCode === 27) {
        slidur.remove();
      }
    });
  });
});

postHeader.appendChild(startBtn);
