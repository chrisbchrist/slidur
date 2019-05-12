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
    this.play = false;
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex = this.currentIndex - 1;
      setImage(this.images[this.currentIndex]);
      this.updateProgress();
    }
  }

  nextSlide() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex = this.currentIndex + 1;
      setImage(this.images[this.currentIndex]);
      this.updateProgress();
    }
  }

  setInterval(newInterval) {
    this.interval = newInterval;
  }

  togglePlay() {
    const btnImg = this.timer
      ? chrome.extension.getURL("img/play-solid.svg")
      : chrome.extension.getURL("img/pause-solid.svg");
    if (!this.timer) {
      this.timer = setInterval(() => this.nextSlide(), this.interval);
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

  reset() {}
}

function getImages(hash) {
  return $.ajax({
    url: "https://api.imgur.com/3/album/" + hash + "/images",
    method: "GET",
    headers: {
      Authorization: "Client-ID 07a9a283b2003c0"
    }
  });
}

function setImage(url) {
  document.getElementById("current-img").src = url;
}

function preloadImages(currentIndex) {}

function toggleArrows() {
  const arrows = document.getElementsByClassName("slidur__control");
  for (let i = 0; i < 2; i++) {
    arrows[i].classList.toggleClass("slidur__control--hidden");
  }
}

function removeSlidur() {
  const app = document.getElementById("app");
  document.body.removeChild(app);
}

//Create start button at the top of the gallery container
const iconUrl = chrome.extension.getURL("img/slideshow-icon.svg");
const postHeader = document.getElementsByClassName("post-header")[0];
const startBtn = document.createElement("div");
startBtn.classList.add("slidur__start-btn");
startBtn.innerHTML =
  "<img class='slidur__icon' src='" + iconUrl + "'/>Slidur</div>";

//Get images from Imgur API, creates HTML template and appends to body
startBtn.addEventListener("click", function() {
  let slidur = new Slidur();
  //Imgur galleries are preceded by 'gallery' or 'a' routes
  const currentUrl = window.location.href;
  const galleryHash =
    currentUrl.indexOf("gallery") > -1
      ? currentUrl.split("/gallery/")[1]
      : currentUrl.split("/a/")[1];

  getImages(galleryHash).done(function(response) {
    //Add images to slidur
    let imageLinks = [];
    for (let i = 0; i < response.data.length; i++) {
      imageLinks.push(response.data[i].link);
    }
    slidur.images = imageLinks;

    //Create backdrop container
    const bg = document.createElement("div");
    bg.classList.add("slidur__bg");
    bg.id = "app";

    //Import icon URL's from extension
    const prevIcon = chrome.extension.getURL("img/chevron-left-solid.svg");
    const nextIcon = chrome.extension.getURL("img/chevron-right-solid.svg");
    const playIcon = chrome.extension.getURL("img/play-solid.svg");
    const intervalIcon = chrome.extension.getURL("img/clock-regular.svg");
    const checklIcon = chrome.extension.getURL("img/check-solid.svg");
    const xIcon = chrome.extension.getURL("img/times-solid.svg");

    bg.innerHTML = `
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
    <img id="current-img" class="slidur__current-img" src=${
      slidur.images[slidur.currentIndex]
    }/>
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
    document.body.appendChild(bg);
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

    document.getElementById("close").addEventListener("click", removeSlidur);

    document
      .getElementById("change-interval")
      .addEventListener("click", function() {
        document
          .getElementsByClassName("slidur__interval-wrapper")[0]
          .classList.add("slidur__interval-wrapper--open");
      });
    document
      .getElementById("interval-confirm")
      .addEventListener("click", function() {
        const newInterval = document.getElementById("interval-input").value;
        if (parseInt(newInterval) > 99 && parseInt(newInterval) < 60001) {
          slidur.setInterval(newInterval);
          document
            .getElementsByClassName("slidur__interval-wrapper")[0]
            .classList.remove("slidur__interval-wrapper--open");
        } else {
          alert("Please enter a value between 100 and 60000.");
        }
      });

    document
      .getElementById("interval-cancel")
      .addEventListener("click", function() {
        document
          .getElementsByClassName("slidur__interval-wrapper")[0]
          .classList.remove("slidur__interval-wrapper--open");
      });
  });
});

postHeader.appendChild(startBtn);
