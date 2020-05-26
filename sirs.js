"use strict";
var app = new PIXI.Application({ width: 800, height: 600 });
document.body.appendChild(app.view);
function random(min, max) {
    return Math.random() * (max - min) + min;
}
var Vector = /** @class */ (function () {
    function Vector(a, b) {
        this.x = a;
        this.y = b;
    }
    Vector.prototype.transform = function (t) {
        this.x += t.x;
        this.y += t.y;
    };
    Vector.prototype.mag = function () {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    };
    Vector.prototype.normalize = function () {
        var m = this.mag();
        return new Vector(this.x / m, this.y / m);
    };
    Vector.prototype.scale = function (s) {
        this.x *= s;
        this.y *= s;
    };
    return Vector;
}());
var Manager = /** @class */ (function () {
    function Manager() {
        this.amountSusceptible = 0;
        this.oldAmountInfected = 0;
        this.amountInfected = 0;
        this.oldAmountRemoved = 0;
        this.amountRemoved = 0;
        this.deltaS = 0;
        this.deltaR = 0;
        this.rNot = 0;
        this.spead = 0;
        this.ttr = 0;
        this.rNots = [];
    }
    Manager.prototype.calculate_deltas = function () {
        if (this.amountInfected - this.oldAmountInfected != 0)
            this.deltaS = (this.amountInfected - this.oldAmountInfected);
        this.oldAmountInfected = this.amountInfected;
        if (this.amountRemoved - this.oldAmountRemoved != 0)
            this.deltaR = (this.amountRemoved - this.oldAmountRemoved);
        this.oldAmountRemoved = this.amountRemoved;
    };
    Manager.prototype.calculate_rNot = function () {
        if (this.deltaS != 0 || this.deltaR != 0) {
            if (this.deltaS / this.deltaR != -1)
                this.rNot = this.deltaS / this.deltaR;
        }
        if (this.rNot < 100)
            this.rNots.push(this.rNot);
    };
    Manager.prototype.mean_rNot = function () {
        var total = 0;
        for (var i = 0; i < this.rNots.length; i++) {
            total += this.rNots[i];
        }
        return total / this.rNots.length;
    };
    return Manager;
}());
var State;
(function (State) {
    State[State["Susceptible"] = 1] = "Susceptible";
    State[State["Infected"] = 2] = "Infected";
    State[State["Removed"] = 3] = "Removed";
})(State || (State = {}));
var Person = /** @class */ (function () {
    function Person() {
        this.waypoints = [];
        this.pos = new Vector(random(10, 790), random(10, 590));
        this.speed = .5;
        this.state = State.Susceptible;
        this.goto = 0;
        this.timeToRemoved = 0;
        this.removedRandomness = random(-3000, 3000);
        for (var i = 0; i < 10; i++) {
            this.waypoints[i] = new Vector(random(10, 790), random(10, 590));
        }
    }
    Person.prototype.draw = function (graphics) {
        switch (+this.state) {
            case State.Susceptible:
                graphics.beginFill(0x00c932);
                break;
            case State.Infected:
                graphics.beginFill(0xde2500);
                break;
            case State.Removed:
                graphics.beginFill(0x3a393d);
                break;
        }
        graphics.drawCircle(this.pos.x, this.pos.y, 10);
        graphics.endFill();
    };
    Person.prototype.move_to = function (place) {
        var d = new Vector(place.x - this.pos.x, place.y - this.pos.y);
        d = d.normalize();
        d.scale(this.speed);
        if ((Math.round(this.pos.x) == Math.round(this.waypoints[this.goto].x)) || (Math.round(this.pos.y) == Math.round(this.waypoints[this.goto].y))) {
            this.goto += Math.round(random(1, 10));
            this.goto %= 10;
        }
        this.pos.transform(d);
    };
    Person.prototype.collide_with_other = function (p2) {
        var chance = random(1, 100);
        if (chance < manager.spead) {
            var dx = this.pos.x - p2.pos.x;
            var dy = this.pos.y - p2.pos.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            //10 is radius
            if (distance < 10 + 10) {
                if (this.state == State.Infected) {
                    if (p2.state == State.Susceptible) {
                        p2.state = State.Infected;
                        manager.amountInfected++;
                        manager.amountSusceptible--;
                    }
                }
            }
        }
    };
    Person.prototype.check_if_removed = function (time) {
        this.timeToRemoved += time;
        if (this.timeToRemoved + this.removedRandomness >= manager.ttr) {
            this.state = State.Removed;
            manager.amountRemoved++;
            manager.amountInfected--;
        }
    };
    return Person;
}());
var graphics = new PIXI.Graphics();
app.stage.addChild(graphics);
var manager = new Manager();
var people = [];
function start() {
    manager = new Manager();
    people = [];
    var amount = +document.getElementById("pop").value;
    manager.spead = +document.getElementById("spread").value;
    manager.ttr = +document.getElementById("ttr").value;
    for (var i = 0; i < amount; i++) {
        people.push(new Person());
        manager.amountSusceptible++;
    }
    people[0].state = State.Infected;
}
var timer = 0;
app.ticker.add(function (delta) {
    timer += app.ticker.deltaMS;
    timer %= 1000;
    graphics.clear();
    for (var i = 0; i < people.length; i++) {
        people[i].draw(graphics);
        people[i].move_to(people[i].waypoints[people[i].goto]);
        if (people[i].state == State.Infected)
            people[i].check_if_removed(app.ticker.deltaMS);
        if (timer <= 60) {
            if (people[i].state == State.Infected) {
                for (var j = 0; j < people.length; j++) {
                    if (i != j)
                        people[i].collide_with_other(people[j]);
                }
            }
        }
    }
    if (timer <= 60) {
        manager.calculate_deltas();
        manager.calculate_rNot();
        console.log(manager.mean_rNot());
    }
});
