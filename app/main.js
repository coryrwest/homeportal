// Momentum Dashboard Page Script

m.isValidDate = function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" ) {
    return false;
  }
  return !isNaN(d.getTime());
};

function isNewDay(date) {
  var today = new Date(localStorage.today);

  if ((today.getDate() !== date.getDate() && date.getHours() >= 5) || (today.getDate() == date.getDate() && date.getHours() >= 5 && today.getHours() < 5)) {
    return true;
  }

  return false;
}

function isDateInFuture(date) {
  return Date.parse(date) > Date.parse(new Date());
}

function ensureLocalStorageDatesAreValid() {
  var date = new Date();
  var dateKeys = ['today', 'backgroundUpdate'];

  for (var i in dateKeys) {
    var lsDate = new Date(localStorage[dateKeys[i]]);
    if (!m.isValidDate(lsDate) || isDateInFuture(lsDate)) {
      console.log('resetting ' + dateKeys[i]);
      localStorage[dateKeys[i]] = date;
    }
  }
}

/** Models **/
m.models.Date = Backbone.Model.extend({
    defaults: function () {
        var date = new Date();
        var hour12clock = JSON.parse(localStorage.hour12clock);
        return {
            date: date,
            hour12clock: hour12clock
        };
    },
    initialize: function(){
        this.listenTo(this, 'change:date', this.updateTime, this);
    },
    getTimeString: function(date) {
        var hour12clock = this.get('hour12clock');
        date = date || this.get('date');
        var hour = date.getHours();
        var minute = date.getMinutes();
        if (hour12clock == true) {
            hour = ((hour + 11) % 12 + 1);
        }
        if (hour < 10 && !hour12clock) { hour = "0" + hour; }
        if (minute < 10) { minute = "0" + minute; }
        return hour + ':' + minute;
    },
    getTimePeriod: function() {
        if (this.get('date').getHours() >= 12) { return 'PM'; } else { return 'AM' };
    },
    updateTime: function() {
        var now = this.getTimeString();
        if (this.get('time') != now) {
            this.set('time', now);
        }
    }
});

m.models.App = Backbone.Model.extend({
    parse: function(response) {
        this.set({ 'text': response.text, 'tip': response.tip, 'link': response.link, 'icon': response.icon });
    }
});


/** Collections **/

m.collect.App = Backbone.Collection.extend({
    model: m.models.App,
    url: 'app/apps.json',
    parse: function (response) {
        return response.apps;
    }
});


/** Views **/

m.views.CenterClock = Backbone.View.extend({
    id: 'centerclock',
    template: Handlebars.compile( $("#centerclock-template").html() ),
    events: {
        "dblclick": "toggleFormat",
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:time', this.updateTime, this);
    },
    render: function () {
        var time = this.model.getTimeString();

        var variables = { time: time };
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html( this.template(variables) ).fadeTo(500, 1);
        this.$time = this.$('.time');
        this.$format = this.$('.format');
    },
    toggleFormat: function () {
        var hour12clock = !this.model.get('hour12clock');
        this.model.set({ hour12clock: hour12clock });
        localStorage.hour12clock = hour12clock;
        if (hour12clock) {
            setTimeout(function(){
                $('.format').addClass('show');
            }, 40);
            this.$format.html(this.model.getTimePeriod());
        } else {
            $('.format').removeClass('show');
        }
    },
    updateTime: function () {
        this.$time.html(this.model.getTimeString());
    }
});

m.views.Apps = Backbone.View.extend({
    id: 'apps',
    template: Handlebars.compile( $("#app-template").html() ),
    initialize: function () {
        this.render();
    },
    render: function () {
        // get apps
        var variables = this.collection.models;
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html( this.template(variables) ).fadeTo(500, 1);
    }
});

function setEndOfContenteditable(contentEditableElement) {
    var range, selection;
    if (document.createRange) { //Firefox, Chrome, Opera, Safari, IE 9+
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
}

m.views.Greeting = Backbone.View.extend({
    id: 'greeting',
    template: Handlebars.compile( $("#greeting-template").html() ),
    events: {
        "dblclick .name": "editName",
        "keypress .name": "onKeypress",
        "keydown .name": "onKeydown",
        "blur .name": "saveName",
        "webkitAnimationEnd .name": "onAnimationEnd"
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:time', this.updatePeriod, this);
    },
    render: function () {
        var period = this.getPeriod();
        var name = localStorage.name;
        var variables = { period: period, name: name };
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html( this.template(variables) ).fadeTo(500, 1);

        this.$period = this.$('.period');
        this.$name = this.$('.name');
    },
    getPeriod: function () {
        var now = this.model.get('date');
        var hour = now.getHours();
        var period;
        if (hour >= 3 && hour < 12) period = 'morning';
        if (hour >= 12 && hour < 17) period = 'afternoon';
        if (hour >= 17 || hour < 3) period = 'evening';
        return period;
    },
    updatePeriod: function () {
        this.$period.html(this.getPeriod());
    },
    editName: function () {
        if (!this.$name.hasClass('editing')) {
          this.$name.attr('contenteditable', true).addClass('editing pulse').focus();
          setEndOfContenteditable(this.$name.get(0));
        }
    },
    onAnimationEnd: function (e) {
      if (e.originalEvent.animationName === "pulse") {
        this.$name.removeClass('pulse');
      }
    },
    onKeypress: function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.saveName();
        }
    },
    onKeydown: function (e) {
        if (e.keyCode === 27) {
            this.$name.html(localStorage.name); //revert
            this.doneEditingName();
        }
    },
    saveName: function () {
        var newName = this.$name.html();
        if (newName === "") {
          this.$name.html(localStorage.name); //revert
        } else {
          localStorage.name = newName;
        }
        this.doneEditingName();
    },
    doneEditingName: function () {
        this.$name.attr('contenteditable', false).removeClass('editing').addClass('pulse');
    }
});

// Parent view
m.views.Dashboard = Backbone.View.extend({
    initialize: function () {
        // set up empty localstorage variables for JSON.parse
        // remove this one we get sync set up
        if (!localStorage.hour12clock) {
            localStorage.hour12clock = true;
        }
        if (!localStorage['momentum-messageRead']) {
            localStorage['momentum-messageRead'] = JSON.stringify({ version: "0" });
        }

        var names = ["sexy", "good looking", "superstar", "smarty pants", "gorgeous", "lovely", "friend", "pal", "classy", "rockstar", "you wonderful human"];
        var name = names[Math.floor(Math.random() * names.length)];
        //if (!localStorage.name) {
            localStorage.name = name;
        //}

        m.models.date = new m.models['Date']();

        var view = this;
        view.render();

        ensureLocalStorageDatesAreValid();

        this.dateIntervalId = setInterval(function () {
            m.models.date.set('date', new Date());
        }, 100);
    },
    render: function () {        
        m.views.background = new m.views.Background({ region: 'background' });
        
        // Load widgets
        m.views.greeting = new m.views.Greeting({ model: m.models.date, region: 'center', order: 'prepend' });
        m.views.centerClock = new m.views.CenterClock({ model: m.models.date, region: 'center', order: 'prepend' });
        
        m.collect.app = new m.collect.App();
        m.collect.app.fetch({async: false});
        
        m.views.apps = new m.views.Apps({ model: m.models.app, collection: m.collect.app, region: 'center', order: 'append' });
    }
});


/** Bootstrap **/

$(function() {
    var fadetime = 500;
    
    /* Create parent AppView */
    m.appView = new m.views.Dashboard();

    // feature rotator
    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    var $feature = $('.feature');
    var features = ["inspiration", "todo", "weather", "quotes", "photography", "focus", "positivity", "motivation"];
    shuffle(features);
    $feature.html(features[features.length - 1]);
    $feature.css('width', $feature.width());

    $.fn.rotateFeatures = function() {
        var feature = features.shift()
        features.push(feature);

        var self = this;
        self.fadeTo(fadetime, 0, function() {
            self.append('<span class="prototype">' + feature + '</span>');
            var newWidth = self.find('.prototype').width();
            self.css('width', newWidth + 'px').html(feature).fadeTo(fadetime, 1);
        });
        return this;
    };

    setInterval(function() {
        $feature.rotateFeatures();
    }, 4000);
});