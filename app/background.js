// Views
m.views.Background = Backbone.View.extend({
    tagName: 'li',
    attributes: {  },
    //template: Handlebars.compile( $("#background-template").html() ),
    initialize: function () {
        this.listenTo(m, 'newDay', this.loadNewBg, this);
        this.render();
    },
    render: function () {
        var that = this;
        var order = (this.options.order || 'append') + 'To';

        $('#background').css('background-image',$('#background').find('li').css('background-image'));

        $('<img/>').attr('src', 'https://source.unsplash.com/category/nature/1600x900').load(function() {
            that.$el[order]('#' + that.options.region).css('background-image','url(https://source.unsplash.com/category/nature/1600x900)').css('opacity','0').fadeTo(200, 1);
            $(this).remove();
        });

        // JO: Render Background Info subview
        this.backgroundInfo = new m.views.BackgroundInfo({ region: 'bottom-left' });
        var order = (this.backgroundInfo.options.order  || 'append') + 'To';
        $('#background-info').remove();
        this.backgroundInfo.render().$el[order]('#' + this.backgroundInfo.options.region);
    }
});

m.views.BackgroundInfo = Backbone.View.extend({
    tagName: 'div',
    attributes: { id: 'background-info', class: 'light' },
    template: Handlebars.compile($("#background-info-template").html()),
    events: {
        "mouseenter": "removeFade",
        "mouseleave": "addFade"
    },
    initialize: function () {
        this.addFade();
    },
    render: function () {
        var title = this.options.title;
        if (!title) {
            title = "";
            this.$el.addClass('title-unknown');
        }
        var variables = { title: title };
        this.$el.html(this.template(variables));

        return this;
    },
    removeFade: function() {
        this.$el.removeClass('fadeout');
    },
    addFade: function(options) {
        this.$el.addClass('fadeout');
    }
});