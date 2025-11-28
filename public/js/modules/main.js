(function ($) {
  "use strict";

  $(function () {
    // ============== Mobile Menu Sidebar & Offcanvas Js Start ========
    $(".toggle-mobileMenu").on("click", function () {
      $(".mobile-menu").addClass("active");
      $(".side-overlay").addClass("show");
      $("body").addClass("scroll-hide-sm");
    });

    $(".close-button, .side-overlay").on("click", function () {
      $(".mobile-menu").removeClass("active");
      $(".side-overlay").removeClass("show");
      $("body").removeClass("scroll-hide-sm");
    });
    // ============== Mobile Menu Sidebar & Offcanvas Js End ========

    // ============== Mobile Nav Menu Dropdown Js Start =======================
    var windowWidth = $(window).width();

    $(".has-submenu").on("click", function () {
      var thisItem = $(this);

      if (windowWidth < 992) {
        if (thisItem.hasClass("active")) {
          thisItem.removeClass("active");
        } else {
          $(".has-submenu").removeClass("active");
          $(thisItem).addClass("active");
        }

        var submenu = thisItem.find(".nav-submenu");

        $(".nav-submenu").not(submenu).slideUp(300);
        submenu.slideToggle(300);
      }
    });
    // ============== Mobile Nav Menu Dropdown Js End =======================

    // ===================== Scroll Back to Top Js Start ======================
    var progressPath = document.querySelector(".progress-wrap path");
    var pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "none";
    progressPath.style.strokeDasharray = pathLength + " " + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 10ms linear";
    var updateProgress = function () {
      var scroll = $(window).scrollTop();
      var height = $(document).height() - $(window).height();
      var progress = pathLength - (scroll * pathLength) / height;
      progressPath.style.strokeDashoffset = progress;
    };
    updateProgress();
    // $(window).scroll(updateProgress);
    $(window).on("scroll", updateProgress);
    var offset = 50;
    var duration = 550;
    jQuery(window).on("scroll", function () {
      if (jQuery(this).scrollTop() > offset) {
        jQuery(".progress-wrap").addClass("active-progress");
      } else {
        jQuery(".progress-wrap").removeClass("active-progress");
      }
    });
    jQuery(".progress-wrap").on("click", function (event) {
      event.preventDefault();
      jQuery("html, body").animate({ scrollTop: 0 }, duration);
      return false;
    });
    // ===================== Scroll Back to Top Js End ======================

    // ========================== add active class to ul>li top Active current page Js Start =====================
    function dynamicActiveMenuClass(selector) {
      let FileName = window.location.pathname.split("/").reverse()[0];

      // If we are at the root path ("/" or no file name), keep the activePage class on the Home item
      if (FileName === "" || FileName === "index.html") {
        // Keep the activePage class on the Home link
        selector
          .find("li.nav-menu__item.has-submenu")
          .eq(0)
          .addClass("activePage");
      } else {
        // Remove activePage class from all items first
        selector.find("li").removeClass("activePage");

        // Add activePage class to the correct li based on the current URL
        selector.find("li").each(function () {
          let anchor = $(this).find("a");
          if ($(anchor).attr("href") == FileName) {
            $(this).addClass("activePage");
          }
        });

        // If any li has activePage element, add class to its parent li
        selector.children("li").each(function () {
          if ($(this).find(".activePage").length) {
            $(this).addClass("activePage");
          }
        });
      }
    }

    if ($("ul").length) {
      dynamicActiveMenuClass($("ul"));
    }
    // ========================== add active class to ul>li top Active current page Js End =====================

    // ========================== Select2 Js Start =================================
    $(".js-example-basic-single").select2();
    // ========================== Select2 Js End =================================

    // ========================== Select2 Js End =================================
    $(".search-icon").on("click", function () {
      $(".search-box").addClass("active");
    });
    $(".search-box__close").on("click", function () {
      $(".search-box").removeClass("active");
    });
    // ========================== Select2 Js End =================================

    // ========================== Category Dropdown Responsive Js Start =================================
    $(".responsive-dropdown .has-submenus-submenu").on("click", function () {
      var windowWidth = $(window).width();
      if (windowWidth < 992) {
        if ($(this).hasClass("active")) {
          $(this).removeClass("active");
          $(this).children(".submenus-submenu").slideUp();
        } else {
          $(".responsive-dropdown .has-submenus-submenu").removeClass("active");
          $(".responsive-dropdown .has-submenus-submenu")
            .children(".submenus-submenu")
            .slideUp();

          $(this).addClass("active");
          $(this).children(".submenus-submenu").slideDown();
        }
      }
    });
    // ========================== Category Dropdown Responsive Js End =================================

    // ========================== On Click Category menu show Js Start =================================
    $(".category__button").on("click", function () {
      $(".responsive-dropdown").addClass("active");
      $(".side-overlay").addClass("show");
      $("body").addClass("scroll-hide-sm");
    });
    $(".side-overlay, .close-responsive-dropdown").on("click", function () {
      $(".responsive-dropdown").removeClass("active");
      $(".side-overlay").removeClass("show");
      $("body").removeClass("scroll-hide-sm");
    });
    // ========================== On Click Category menu show Js End =================================

    // ========================== Set Language in dropdown Js Start =================================
    $(".selectable-text-list li").each(function () {
      var thisItem = $(this);

      thisItem.on("click", function () {
        const listText = thisItem.text();
        var item = thisItem
          .parent()
          .parent()
          .find(".selected-text")
          .text(listText);
      });
    });
    // ========================== Set Language in dropdown Js End =================================

    // ========================= Banner Slider Js Start ==============
    $(".banner-slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#banner-next",
      prevArrow: "#banner-prev",
    });

    $(".banner-slider").on(
      "beforeChange",
      function (event, slick, currentSlide, nextSlide) {
        $(".wow").css("visibility", "hidden").removeClass("animated");
      },
    );

    $(".banner-slider").on(
      "afterChange",
      function (event, slick, currentSlide) {
        $(".wow").css("visibility", "visible");
      },
    );

    // ========================= Banner Slider Js End ===================

    // ========================= custom tab start ===================
    $(".bt-tab-pane").hide();
    $(".bt-tab-pane:first").show();

    $(".bt-tb-btn").on("click", function () {
      $(".bt-tb-btn").removeClass("active");
      $(this).addClass("active");
      $(".bt-tab-pane").hide();
      var target = $(this).data("target");
      $(target).fadeIn(500);
      return false;
    });

    $(".bt-tab-pane-t").hide();
    $(".bt-tab-pane-t:first").show();

    $(".bt-tb-btn-t").on("click", function () {
      $(".bt-tb-btn-t").removeClass("active");
      $(this).addClass("active");
      $(".bt-tab-pane-t").hide();
      var target = $(this).data("target");
      $(target).fadeIn(500);
      return false;
    });

    $(".bt-pane-p").hide();
    $(".bt-pane-p:first").show();

    $(".bt-tb-btn-p").on("click", function () {
      $(".bt-tb-btn-p").removeClass("active");
      $(this).addClass("active");
      $(".bt-pane-p").hide();
      var target = $(this).data("target");
      $(target).fadeIn(500);
      return false;
    });

    $(".bt-pane-pr").hide();
    $(".bt-pane-pr:first").show();

    $(".bt-tb-btn-pr").on("click", function () {
      $(".bt-tb-btn-pr").removeClass("active");
      $(this).addClass("active");
      $(".bt-pane-pr").hide();
      var target = $(this).data("target");
      $(target).fadeIn(500);
      return false;
    });
    // ========================= custom tab end ===================

    // ========================= Banner Three Slider Js Start ==============
    $(".banner-three-slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#banner-three-next",
      prevArrow: "#banner-three-prev",
    });

    $(".banner-three-slider").on(
      "beforeChange",
      function (event, slick, currentSlide, nextSlide) {
        $(".wow").css("visibility", "hidden").removeClass("animated");
      },
    );

    $(".banner-three-slider").on(
      "afterChange",
      function (event, slick, currentSlide) {
        $(".wow").css("visibility", "visible");
      },
    );
    // ========================= Banner Three Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".feature-item-wrapper").slick({
      slidesToShow: 10,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#feature-item-wrapper-next",
      prevArrow: "#feature-item-wrapper-prev",
      responsive: [
        {
          breakpoint: 1699,
          settings: {
            slidesToShow: 9,
          },
        },
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 8,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 6,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 5,
          },
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 4,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 359,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".feature-three-item-wrapper").slick({
      slidesToShow: 6,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#feature-item-wrapper-next",
      prevArrow: "#feature-item-wrapper-prev",
      responsive: [
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 5,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 4,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 359,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= Banner Slider Js Start ==============
    $(".banner-item-two__slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: true,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#banner-next",
      prevArrow: "#banner-prev",
      responsive: [
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });
    $(".banner-item-two__slider").on(
      "beforeChange",
      function (event, slick, currentSlide, nextSlide) {
        $(".wow").css("visibility", "hidden").removeClass("animated");
      },
    );

    $(".banner-item-two__slider").on(
      "afterChange",
      function (event, slick, currentSlide) {
        $(".wow").css("visibility", "visible");
      },
    );
    // ========================= Banner Slider Js End ===================

    // ========================= flash Sale Four Slider Js Start ==============
    $(".flash-sales__slider").slick({
      slidesToShow: 2,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#flash-next",
      prevArrow: "#flash-prev",
      responsive: [
        {
          breakpoint: 991,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= flash Sale Four Slider Js End ==================

    // ========================= hot deals Slider Js Start ==============
    $(".hot-deals-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#deals-next",
      prevArrow: "#deals-prev",
      responsive: [
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".deals-week-slider").slick({
      slidesToShow: 6,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#deal-week-next",
      prevArrow: "#deal-week-prev",
      responsive: [
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 5,
            arrows: false,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".top-selling-product-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#top-selling-next",
      prevArrow: "#top-selling-prev",
      responsive: [
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".organic-food__slider").slick({
      slidesToShow: 6,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#organic-next",
      prevArrow: "#organic-prev",
      responsive: [
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 6,
            arrows: false,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 4,
            arrows: false,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= New arrival Slider Js Start ==============
    $(".new-arrival__slider").slick({
      slidesToShow: 6,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#new-arrival-next",
      prevArrow: "#new-arrival-prev",
      responsive: [
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 6,
            arrows: false,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 4,
            arrows: false,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= New arrival Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".short-product-list").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      prevArrow:
        '<button type="button" class="slick-prev border border-solid border-gray-100 w-30 h-30 bg-transparent rounded-[50rem] absolute hover-bg-main-600 hover-text-white hover-border-main-600 duration-100 ease-linear"><i class="ph ph-caret-left"></i></button>',
      nextArrow:
        '<button type="button" class="slick-next border border-solid border-gray-100 w-30 h-30 bg-transparent rounded-[50rem] absolute hover-bg-main-600 hover-text-white hover-border-main-600 duration-100 ease-linear"><i class="ph ph-caret-right"></i></button>',
    });

    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".brand-slider").slick({
      slidesToShow: 8,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#brand-next",
      prevArrow: "#brand-prev",
      responsive: [
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 7,
            arrows: false,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 6,
            arrows: false,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 5,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 4,
            arrows: false,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 359,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= Category Dropdown Two Js Start ===============================
    $(".category-two .category__button").on("click", function () {
      $(".category-two .category__button").toggleClass("active");
      $(".responsive-dropdown.style-two").addClass("active").slideToggle(400);
    });
    // ========================= Category Dropdown Two Js End ===============================

    // ========================= Featured Products Slider Js Start ==============
    $(".featured-product-slider").slick({
      slidesToShow: 2,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#featured-products-next",
      prevArrow: "#featured-products-prev",
      responsive: [
        {
          breakpoint: 991,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= Featured Products Slider Js End ==================

    // ========================= hot deals Slider Js Start ==============
    $(".recommended-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#recommended-next",
      prevArrow: "#recommended-prev",
      responsive: [
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".vendor-card__list.style-two").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#vendor-next",
      prevArrow: "#vendor-prev",
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= hot deals Slider Js Start ==============
    $(".top-brand__slider").slick({
      slidesToShow: 8,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#topBrand-next",
      prevArrow: "#topBrand-prev",
      responsive: [
        {
          breakpoint: 1599,
          settings: {
            slidesToShow: 7,
            arrows: false,
          },
        },
        {
          breakpoint: 1399,
          settings: {
            slidesToShow: 6,
            arrows: false,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 5,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 4,
            arrows: false,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 359,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
      ],
    });
    // ========================= hot deals Slider Js End ===================

    // ========================= Product Details Thumbs Slider Js Start ===================
    $(".product-details__thumb-slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      fade: true,
      asNavFor: ".product-details__images-slider",
    });

    $(".product-details__images-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      asNavFor: ".product-details__thumb-slider",
      dots: false,
      arrows: false,
      focusOnSelect: true,
    });
    // ========================= Product Details Thumbs Slider Js End ===================

    // ========================= Increment & Decrement Js Start ===================
    var minus = $(".quantity__minus");
    var plus = $(".quantity__plus");

    $(plus).on("click", function () {
      var input = $(this).siblings(".quantity__input");
      var value = input.val();
      value++;
      input.val(value);
    });

    $(minus).on("click", function () {
      var input = $(this).siblings(".quantity__input");
      var value = input.val();
      if (value > 1) {
        value--;
      }
      input.val(value);
    });
    // ========================= Increment & Decrement Js End ===================

    // ========================= Color List Js Start ===================
    $(".color-list__button").on("click", function () {
      $(".color-list__button").removeClass("border-gray-900");

      if (!$(this).hasClass("border-gray-900")) {
        $(this).addClass("border-gray-900");
        $(this).removeClass("border-gray-50");
      } else {
        $(this).removeClass("border-gray-900");
        $(this).addClass("border-gray-50");
      }
    });
    // ========================= Color List Js End ===================

    // ========================== Range Slider Js Start =====================
    $(function () {
      $("#slider-range").slider({
        range: true,
        min: 0,
        max: 25,
        values: [0, 25],
        slide: function (event, ui) {
          $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
        },
      });
      $("#amount").val(
        "$" +
          $("#slider-range").slider("values", 0) +
          " - $" +
          $("#slider-range").slider("values", 1),
      );
    });
    // ========================== Range Slider Js End =====================

    // ========================== List Grid Js Start ================================
    $(".list-btn").on("click", function () {
      $(".grid-btn").addClass("border-gray-100");
      $(".grid-btn").removeClass("border-main-600 text-white bg-main-600");
      $(".list-grid-wrapper").removeClass("list-view");

      $(this).removeClass("border-gray-100");
      $(this).addClass("border-main-600 text-white bg-main-600");
      $(".list-grid-wrapper").addClass("list-view");
    });

    $(".grid-btn").on("click", function () {
      $(".list-btn").addClass("border-gray-100");
      $(".list-btn").removeClass("border-main-600 text-white bg-main-600");
      $(".list-grid-wrapper").removeClass("list-view");

      $(this).removeClass("border-gray-100");
      $(this).addClass("border-main-600 text-white bg-main-600");
    });
    // ========================== List Grid Js End ================================

    // ========================== Shop Sidebar Js Start ================================
    $(".sidebar-btn").on("click", function () {
      $(this).addClass("bg-main-600 text-white");
      $(".shop-sidebar").addClass("active");
      $(".side-overlay").addClass("show");
      $("body").addClass("scroll-hide-sm");
    });

    $(".side-overlay, .shop-sidebar__close").on("click", function () {
      $(".sidebar-btn").removeClass("bg-main-600 text-white");
      $(".shop-sidebar").removeClass("active");
      $(".side-overlay").removeClass("show");
      $("body").removeClass("scroll-hide-sm");
    });
    // ========================== Shop Sidebar Js End ================================

    // ========================== Remove Tr Js Start ================================
    $(".remove-tr-btn").on("click", function () {
      $(this).closest("tr").addClass("hidden");
    });
    // ========================== Remove Tr Js End ================================

    // ========================== Checkout Payment Method Js Start ================================
    $(".payment-item .form-check-input:checked")
      .closest(".payment-item")
      .find(".payment-item__content")
      .show();

    $(".payment-item .form-check-input").on("change", function () {
      $(".payment-item__content").hide();
      $(this).closest(".payment-item").find(".payment-item__content").show();
    });
    // ========================== Checkout Payment Method Js End ================================

    // ================== Password Show Hide Js Start ==========
    $(".toggle-password").on("click", function () {
      $(this).toggleClass("active");
      var input = $($(this).attr("id"));
      if (input.attr("type") == "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
    // ========================= Password Show Hide Js End ===========================

    // ========================== Text Slide Js Start =====================
    $(".text-slider").marquee({
      pauseOnHover: true,
      allowCss3Support: true,
      css3easing: "linear",
      easing: "linear",
      delayBeforeStart: 1000,
      duration: 7000,
      gap: 20,
      pauseOnCycle: false,
      startVisible: false,
    });
    // ========================== Text Slide Js End =====================

    // ========================== Trending Products Js Strt =====================
    $(".expand-btn").on("click", function () {
      $(this).toggleClass("bg-main-two-600 text-white");
      $(this).parent().find(".expand-icons").toggleClass("flex");

      if ($(this).children("i").hasClass("ph ph-plus")) {
        $(this).children("i").removeClass("ph ph-plus");
        $(this).children("i").addClass("ph ph-x");
      } else {
        $(this).children("i").removeClass("ph ph-x");
        $(this).children("i").addClass("ph ph-plus");
      }
    });

    $(".wishlist-btn").on("click", function () {
      if ($(this).children("i").hasClass("ph ph-heart")) {
        $(this).children("i").removeClass("ph ph-heart");
        $(this).children("i").addClass("ph-fill ph-heart text-main-two-600");
      } else {
        $(this).children("i").removeClass("ph-fill ph-heart text-main-two-600");
        $(this).children("i").addClass("ph ph-heart");
      }
    });
    // ========================== Trending Products Js End =====================

    // ========================== Instagram Slider Js Start =====================
    $(".instagram-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#instagram-next",
      prevArrow: "#instagram-prev",
      responsive: [
        {
          breakpoint: 1299,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 1,
            arrows: false,
          },
        },
      ],
    });
    // ========================== Instagram Slider Js End =====================

    // ========================== Testimonials Thumbs Slider Js Start =====================
    $(".testimonials-slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      asNavFor: ".testimonials-thumbs-slider",
      dots: true,
      centerMode: true,
      focusOnSelect: true,
      fade: true,
      cssEase: "linear",
      dots: false,
      arrows: false,
    });

    $(".testimonials-thumbs-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: false,
      pauseOnHover: true,
      arrows: true,
      draggable: true,
      rtl: $("html").attr("dir") === "rtl" ? true : false,
      speed: 900,
      infinite: true,
      nextArrow: "#testi-next",
      prevArrow: "#testi-prev",
      asNavFor: ".testimonials-slider",
      responsive: [
        {
          breakpoint: 1299,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
      ],
    });
    // ========================== Testimonials Thumbs Slider Js End =====================
    $('[class^="slider-"], [class*=" slider-"]').on("afterChange", function () {
      AOS.refreshHard();
    });
    // ========================= Wow Js Start ===================
    // ========================= Wow Js End ===================

    // ========================= AOS Animation Js Start ===================

    // ========================= AOS Animation Js End ===================
  });
  // ==========================================
  //      End Document Ready function
  // ==========================================

  // ========================= Header Sticky Js Start ==============
  $(window).on("scroll", function () {
    if ($(window).scrollTop() >= 260) {
      $(".header").addClass("fixed-header");
    } else {
      $(".header").removeClass("fixed-header");
    }
  });
  // ========================= Header Sticky Js End===================
})(jQuery);
