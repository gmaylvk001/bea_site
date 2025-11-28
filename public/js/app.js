// main css
import "../styles/app.scss";

// phosphor icons js
import "./vendor/phosphor-icon.js";

// select2 js
import "select2";

// slick slider js
import "slick-carousel/slick/slick.min.js";

// countdown js
import "./modules/count-down.js";

// jquery ui js
import "jquery-ui/ui/widgets/slider";

import WOW from "wowjs";
new WOW.WOW({
  live: false,
}).init();
import "wowjs/css/libs/animate.css";

// aos init
import AOS from "aos";
AOS.init({
  offset: 40,
  duration: 1000,
  easing: "ease",
});

// marquee js
import "jquery.marquee";

// vanilla tilt js
import VanillaTilt from "vanilla-tilt";
VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
  max: 16,
  speed: 500,
  perspective: 5000,
  scale: 1.06,
});

// preloader
import "./modules/preloader.js";

// scroll to top
import "./modules/scroll-to-top-button.js";

// main js
import "./modules/main.js";
