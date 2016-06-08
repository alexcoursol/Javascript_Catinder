/*jslint browser this*/
/*global $ window Promise*/

(function () {
    "use strict";
    var catinder = {
        nbCats: 0,
        cats: [],
        currCat: null,
        localCats: [[], [], []],
        catChecked: 0,
        position: '',
        menu: false,
        myPussies: false,
        init: function () {
            var self = this;
            this.getCats();
            this.request.then(function () {
                self.displayCats();
                self.addListeners();
            });
            if (localStorage.getItem('cats')) {
                this.localCats = JSON.parse(localStorage.getItem('cats'));
            }
            this.getMyPussies();
        },
        addToMyPussies: function () {
            $('#pussies_list').append("<li class='minis'><ul class='mini_cats'><li><img class='mini_photo' src='" + this.currCat.picUrl
                    + "' alt='cat photo'/></li><li class='mini_name'>"
                    + this.currCat.name + ', ' + this.currCat.age + ' years' + "</li></ul></li>");
        },
        getMyPussies: function () {
            var i;
            for (i = 0; i < this.localCats[0].length; i += 1) {
                $('#pussies_list').append("<li class='minis'><ul class='mini_cats'><li><img class='mini_photo' src='" + this.localCats[0][i].picUrl
                        + "' alt='cat photo'/></li><li class='mini_name'>"
                        + this.localCats[0][i].name + ', ' + this.localCats[0][i].age + ' years' + "</li></ul></li>");
            }
        },
        checkPos: function () {
            var self = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    self.position = position.coords.latitude + ',' + position.coords.longitude;
                });
            } else {
                window.alert("Pas de GPS, pas de geoloc !");
            }
        },
        reinit: function () {
            this.nbCats = 0;
            this.catChecked = 0;
            this.currCat = null;
            this.cats = [];
            this.getCats();
            var self = this;
            this.request.then(function () {
                self.displayCats(self.cats);
            });
        },
        getCats: function () {
            var self = this;
            this.request = $.ajax("http://catinder.samsung-campus.net/proxy.php" + self.position, {
                type: 'GET',
                success: function (resp) {
                    var obj = $.parseJSON(resp);
                    var i;
                    for (i = 0; i < obj.nbResult; i += 1) {
                        if (self.checkCats(obj.results[i].sha1)) {
                            self.cats.push(obj.results[i]);
                        }
                    }
                    self.nbCats = self.cats.length;
                    if (self.nbCats === 0) {
                        self.reinit();
                    }
                }
            });
        },
        checkCats: function (sha) {
            if (localStorage.getItem('cats')) {
                var arr = $.parseJSON(localStorage.getItem('cats'));
                var i;
                for (i = 0; i < arr[2].length; i += 1) {
                    if (arr[2][i].sha1 === sha) {
                        return false;
                    }
                }
                return true;
            }
            return true;
        },
        handleTouch: function (val) {
            this.catChecked += 1;
            if (val === 0) {
                this.addToMyPussies();
            }
            this.store(val);
            this.removeCat();
        },
        removeCat: function () {
            this.cats.pop();
            this.currCat = this.cats[this.cats.length - 1];
            $('#container').children().first().remove();
            $('#container').children().first().css('display', 'flex');
            if (this.catChecked === this.nbCats) {
                this.reinit();
            }
        },
        store: function (val) {
            if (this.currCat !== null && this.currCat !== undefined) {
                this.localCats[2].push(this.currCat);
                this.localCats[val].push(this.currCat);
                localStorage.setItem('cats', JSON.stringify(this.localCats));
            }
        },
        addTouchEvents: function () {
            var self = this;
            var imgs = document.getElementsByClassName('profile');
            if (imgs.length > 0) {
                imgs[0].addEventListener('touchstart', function (touchStartEvent) {
                    var theCat = self.currCat;
                    imgs[0].addEventListener('touchmove', function (evt) {
                        if (theCat === self.currCat) {
                            if (imgs[1] !== undefined) {
                                $('#container').children().eq(1).not(document.getElementById("button_box")).removeClass('profile');
                                $('#container').children().eq(1).not(document.getElementById("button_box")).addClass('profile2');
                            }
                            imgs[0].style.position = 'absolute';
                            imgs[0].style.zIndex = '33';
                            var posTouchY = evt.touches[0].clientY - touchStartEvent.touches[0].clientY;
                            var posTouchX = evt.touches[0].clientX - touchStartEvent.touches[0].clientX;
                            $('#current').css({left: posTouchX});
                            $('#current').css({top: posTouchY});
                            if (evt.touches[0].clientX > (screen.width * 90 / 100)) {
                                if (document.getElementById('dislikeMove') === null) {
                                    $('body').append('<div id="dislikeMove"></div>');
                                }
                                self.handleTouch(1);
                            } else if (evt.touches[0].clientX < (screen.width * 10 / 100)) {
                                if (document.getElementById('likeMove') === null) {
                                    $('body').append('<div id="likeMove"></div>');
                                }
                                self.handleTouch(0);
                            }
                        }
                    });
                });
            }
        },
        displayCats: function () {
            var i = 0;
            var self = this;
            var promise;
            promise = new Promise(function (resolve, reject) {
                for (i = 0; i < self.cats.length; i += 1) {
                    $('#container').prepend(
                        "<div class='profile'><ul><li><img class='photo' src='" + self.cats[i].picUrl + "' alt='cat photo'/></li><li class='name'>" +
                        self.cats[i].name + ', ' + self.cats[i].age + ' years' + "</li></ul></div>"
                    );
                }
                self.addTouchEvents();
                if (document.getElementsByClassName('photo')[0] !== null) {
                    resolve("Images loaded");
                } else {
                    reject("Where are my pussies");
                }
            });
            promise.then(function () {
                $('#container').children().first().not(document.getElementById("button_box")).css('display', 'flex');
                $('#container').children().first().not(document.getElementById("button_box")).attr('id', 'current');
                self.currCat = self.cats[self.cats.length - 1];
            });
        },
        addListeners: function () {
            var self = this;
            document.addEventListener('touchstart', function (event) {
                switch (event.target.id) {
                case 'dislike':
                    self.handleTouch(1);
                    break;
                case 'like':
                    self.handleTouch(0);
                    break;
                case 'cat_image':
                    self.handleMenu();
                    break;
                case 'pussies':
                    $('#pussies_list').animate({
                        left: '40vw'
                    }, 500);
                    break;
                case 'clear':
                    localStorage.clear();
                    $('.minis').remove();
                    break;
                case 'close':
                    $('#pussies_list').animate({
                        left: '160vw'
                    }, 500);
                    break;
                }
            });
        },
        handleMenu: function () {
            var left;
            if (this.menu === false) {
                left = '0';
                this.menu = true;
            } else {
                left = '-40vw';
                this.menu = false;
            }
            $('#navigation').animate({
                left: left
            }, 500);
        }
    };
    document.addEventListener('DOMContentLoaded', function () {
        catinder.init();
    });
}());