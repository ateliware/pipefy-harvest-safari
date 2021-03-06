(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var PipefyProfile;
    var debug = true;
    PipefyProfile = (function() {
      function PipefyProfile(config) {
        var _this;
        this.config = config;
        this.addTimer = __bind(this.addTimer, this);
        this.pipeNameSelector = ".pipe-header .pipe-title a";
        this.cardNameSelector = ".card-details .card-header h1.card-name";
        this.actionSelector = ".add-more-launcher ul.dropdown-menu";
        this.platformLoaded = false;
        this.actionElement = null;
        this.renderTries = 0;
        this.timerListItem = null;

        _this = this;
        document.addEventListener('DOMContentLoaded', function() {
          _this.loadHarvestPlatform();

          _this.addTimerWhenUrlChanges();
          _this.addTimerIfAlreadyInCard();
        });

      }

      PipefyProfile.prototype.loadHarvestPlatform = function() {
        var configScript, ph, platformConfig, platformScript,
          _this = this;
        platformConfig = {
          applicationName: "Pipefy",
          permalink: "https://app.pipefy.com/pipes/%PROJECT_ID%#cards/%ITEM_ID%",
          environment: "production",
          skipStyling: true
        };
        configScript = document.createElement("script");
        configScript.innerHTML = "window._harvestPlatformConfig = " + (JSON.stringify(platformConfig)) + ";";
        platformScript = document.createElement("script");
        platformScript.src = "https://platform.harvestapp.com/assets/platform.js";
        platformScript.async = true;
        ph = document.getElementsByTagName("script")[0];
        ph.parentNode.insertBefore(configScript, ph);
        ph.parentNode.insertBefore(platformScript, ph);
        return document.body.addEventListener("harvest-event:ready", function() {
          _this.platformLoaded = true;
          return _this.addTimer();
        });
      };

      PipefyProfile.prototype.addTimer = function() {
        var data;
        if (!this.platformLoaded) {
          return;
        }
        data = this.getDataForTimer();
        if (this.notEnoughInfo(data)) {
          return;
        }

        this.tryBuildTimer(data);
      };

      PipefyProfile.prototype.tryBuildTimer = function(data) {
        var _this = this;
        setTimeout(function() {
          if (document.querySelector(_this.actionSelector) != null) {
            var modalClasses = document.querySelector('.modal').className
            _this.renderTries++;
            !debug || console.info("trying to add button");

            var timerEl = document.querySelector(".harvest-timer");
            var hasTimer = !!timerEl;
            var hasActions = !!document.querySelector(_this.actionSelector);

            if (hasTimer) {
              !debug || console.info("already in!!! romving it!");
              timerEl.parentNode.removeChild(timerEl)
              this.actionElement = null;
              this.timerListItem = null;
            }

            if (!hasActions) {
              !debug || console.info("pipefy is not ready...");
              _this.tryBuildTimer(data);
              return;
            }

            _this.buildTimer(data);
            _this.notifyPlatformOfNewTimers();
            _this.addTimerAgainIfElementRerendered();

            !debug || console.info("button added!" + (_this.renderTries > 1 ? "(for the " + _this.renderTries + " time)" : ""));
          } else {
            _this.tryBuildTimer(data);
          }
        }, 500);
      }

      PipefyProfile.prototype.getDataForTimer = function() {
        var itemName, link, linkParts, projectName, _ref, _ref1;
        itemName = (_ref = document.querySelector(this.cardNameSelector)) != null ? _ref.innerText.trim() : void 0;
        projectName = (_ref1 = document.querySelector(this.pipeNameSelector)) != null ? _ref1.innerText.trim() : void 0;
        link = window.location.href;
        linkParts = link.match(/^https?:\/\/app.pipefy.com(\/v2)?\/pipes\/([0-9]+)#cards\/([0-9]+)$/);
        return {
          project: {
            id: linkParts != null ? linkParts[2] : void 0,
            name: projectName
          },
          item: {
            id: linkParts != null ? linkParts[3] : void 0,
            name: itemName
          }
        };
      };

      PipefyProfile.prototype.notEnoughInfo = function(data) {
        var _ref, _ref1;
        return !(((data != null ? (_ref = data.project) != null ? _ref.id : void 0 : void 0) != null) && ((data != null ? (_ref1 = data.item) != null ? _ref1.id : void 0 : void 0) != null));
      };

      PipefyProfile.prototype.buildTimer = function(data) {
        var actions, icon, timer;
        actions = document.querySelector(this.actionSelector);

        if (!actions) {
          return;
        }

        this.actionElement = actions;

        this.timerListItem = document.createElement("li");
        timer = document.createElement("a");
        timer.className = "harvest-timer button-link js-add-trello-timer";
        timer.setAttribute("id", "harvest-trello-timer");
        timer.setAttribute("href", "#");
        timer.setAttribute("data-project", JSON.stringify(data.project));
        timer.setAttribute("data-item", JSON.stringify(data.item));
        icon = document.createElement("i");
        icon.className = "fa fa-clock-o";
        timer.appendChild(icon);
        timer.appendChild(document.createTextNode(" Track time"));
        this.timerListItem.appendChild(timer);

        timer.onclick = function(evt) { evt.preventDefault(); }

        return actions.insertBefore(this.timerListItem, actions.children[1]);
      };

      PipefyProfile.prototype.notifyPlatformOfNewTimers = function() {
        var evt;
        evt = new CustomEvent("harvest-event:timers:chrome:add");
        return document.querySelector("#harvest-messaging").dispatchEvent(evt);
      };

      PipefyProfile.prototype.addTimerIfAlreadyInCard = function() {
        var link = window.location.href;
        var linkParts = !!link.match(/^https?:\/\/app.pipefy.com(\/v2)\/pipes\/[0-9]+#cards\/[0-9]+$/);
        if(linkParts)
          this.addTimer();
      }

      PipefyProfile.prototype.addTimerAgainIfElementRerendered = function() {
        var checkOks = 0;
        var interval = 500;
        var handler = setInterval((function(_this){
          return function(){
            var actions = document.querySelector(_this.actionSelector);

            if (!actions) {
              // We are not at the card anymore!
              !debug || console.info("Goodbye Mr. Card!");
              _this.renderTries = 0;
              clearInterval(handler);
              return;
            }

            if (actions == _this.actionElement) {
              checkOks++;
              // Check for rerendering only for ONE second
              if (checkOks < 2000 / interval) {
                !debug || !debug || console.info("OK");
                return; // All is ok, for now
              }

              // I bet it stopped rerendering stuff
              !debug || console.info("Cleared");
              _this.renderTries = 0;
              clearInterval(handler);
              return;
            }

            // It rerendered for some reason!
            !debug || console.info("Card rerendered!");
            clearInterval(handler);
            _this.addTimer();
          }
        })(this), interval);
      }

      PipefyProfile.prototype.addTimerWhenUrlChanges = function() {
        var ph, script,
          _this = this;
        script = document.createElement("script");
        script.innerHTML = "(" + (this.notifyOnUrlChanges.toString()) + ")()";
        ph = document.getElementsByTagName("script")[0];
        ph.parentNode.insertBefore(script, ph);
        return window.addEventListener("message", function(evt) {
          if (evt.source !== window) {
            return;
          }
          if (evt.data !== "urlChange") {
            return;
          }
          _this.addTimer();
        });
      };

      PipefyProfile.prototype.notifyOnUrlChanges = function() {
        var change, fn;
        change = function() {
          return window.postMessage("urlChange", "*");
        };
        fn = window.history.pushState;
        window.history.pushState = function() {
          fn.apply(window.history, arguments);
          return change();
        };
        return window.addEventListener("popstate", change);
      };

      return PipefyProfile;

    })();
    console.log("Harvest for Pipefy extension. Github: https://github.com/ateliware/pipefy-harvest-safari")
    return new PipefyProfile();
  })();

}).call(this);
