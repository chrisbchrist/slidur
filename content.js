class Slidur {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.interval = 5000;
    this.preloaded = [];
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex = this.currentIndex - 1;
      setImage(this.images[this.currentIndex]);
      this.getProgress();
    }
  }

  nextSlide() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex = this.currentIndex + 1;
      setImage(this.images[this.currentIndex]);
      this.getProgress();
    }
  }

  setInterval(newInterval) {
    this.interval = newInterval;
  }

  startSlideshow() {
    setInterval(() => this.nextSlide(), 3000);
  }

  getProgress() {
    const ratio = ((this.currentIndex + 1) / this.images.length) * 100;
    updateProgress(ratio);
  }
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

function updateProgress(percent) {
  document.getElementById("progress").style.width = percent + "%";
}

let slidur = new Slidur();

//Add start button at the top of the gallery container
const iconUrl = chrome.extension.getURL("img/slideshow-icon.svg");
const postHeader = document.getElementsByClassName("post-header")[0];
const startBtn = document.createElement("div");
startBtn.classList.add("slidur__start-btn");
startBtn.innerHTML =
  "<img class='slidur__icon' src='" + iconUrl + "'/>Slideshow</div>";

//Get images from Imgur API, creates template and appends to body
startBtn.addEventListener("click", function() {
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

    //Create backdrop
    const bg = document.createElement("div");
    bg.classList.add("slidur__bg");

    const prevIcon = chrome.extension.getURL("img/chevron-left-solid.svg");
    const nextIcon = chrome.extension.getURL("img/chevron-right-solid.svg");

    bg.innerHTML = `
    <div class="slidur__progress-wrapper">
    <div id="progress" class="slidur__progress"></div>
    </div>  
    <div class="slidur__main">
    <div id="back" class="slidur__control slidur__control--back">
      <div class="slidur__arrow slidur__arrow-back">
        <img class="slidur__control-icon" src="${prevIcon}"/>
      </div>
    </div>
    <img id="current-img" class="slidur__current-img" src=${
      slidur.images[slidur.currentIndex]
    }/>
    <div id="next" class="slidur__control slidur__control--next">
       <div class="slidur__arrow slidur__arrow-next">
       <img class="slidur__control-icon" src="${nextIcon}"/>
      </div>
    </div>
    </div>
    `;

    document.body.appendChild(bg);

    document.getElementById("back").addEventListener("click", function() {
      slidur.prevSlide();
    });
    document.getElementById("next").addEventListener("click", function() {
      slidur.nextSlide();
    });
    slidur.updateProgress();
  });
});

postHeader.appendChild(startBtn);