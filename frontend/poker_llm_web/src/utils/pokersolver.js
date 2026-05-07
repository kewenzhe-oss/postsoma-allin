/**
 * pokersolver v2.1.2 — vendored as ES module
 * Original: https://github.com/goldfire/pokersolver
 * Copyright (c) 2016, James Simpson of GoldFire Studios (MIT License)
 *
 * Converted from IIFE to ES module export so Vite can resolve it
 * statically at build time with no CDN or window.Hand race condition.
 */

'use strict';

// NOTE: The 'joker' will be denoted with a value of 'O' and any suit.
const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

class Card {
  constructor(str) {
    this.value = str.substr(0, 1);
    this.suit = str.substr(1, 1).toLowerCase();
    this.rank = values.indexOf(this.value);
    this.wildValue = str.substr(0, 1);
  }
  toString() {
    return this.wildValue.replace('T', '10') + this.suit;
  }
  static sort(a, b) {
    if (a.rank > b.rank) return -1;
    else if (a.rank < b.rank) return 1;
    return 0;
  }
}

class Hand {
  constructor(cards, name, game, canDisqualify) {
    this.cardPool = [];
    this.cards = [];
    this.suits = {};
    this.values = [];
    this.wilds = [];
    this.name = name;
    this.game = game;
    this.sfLength = 0;
    this.alwaysQualifies = true;
    if (canDisqualify && this.game.lowestQualified) {
      this.alwaysQualifies = false;
    }
    if (game.descr === 'standard' && new Set(cards).size !== cards.length) {
      throw new Error('Duplicate cards');
    }
    var handRank = this.game.handValues.length;
    for (var i = 0; i < this.game.handValues.length; i++) {
      if (this.game.handValues[i] === this.constructor) break;
    }
    this.rank = handRank - i;
    this.cardPool = cards.map(function(c) {
      return (typeof c === 'string') ? new Card(c) : c;
    });
    var card;
    for (var i = 0; i < this.cardPool.length; i++) {
      card = this.cardPool[i];
      if (card.value === this.game.wildValue) card.rank = -1;
    }
    this.cardPool = this.cardPool.sort(Card.sort);
    var obj, obj1, key, key1;
    for (var i = 0; i < this.cardPool.length; i++) {
      card = this.cardPool[i];
      if (card.rank === -1) {
        this.wilds.push(card);
      } else {
        (obj = this.suits)[key = card.suit] || (obj[key] = []);
        (obj1 = this.values)[key1 = card.rank] || (obj1[key1] = []);
        this.suits[card.suit].push(card);
        this.values[card.rank].push(card);
      }
    }
    this.values.reverse();
    this.isPossible = this.solve();
  }
  compare(a) {
    if (this.rank < a.rank) return 1;
    else if (this.rank > a.rank) return -1;
    var result = 0;
    for (var i = 0; i <= 4; i++) {
      if (this.cards[i] && a.cards[i] && this.cards[i].rank < a.cards[i].rank) { result = 1; break; }
      else if (this.cards[i] && a.cards[i] && this.cards[i].rank > a.cards[i].rank) { result = -1; break; }
    }
    return result;
  }
  loseTo(hand) { return (this.compare(hand) > 0); }
  getNumCardsByRank(val) {
    var cards = this.values[val];
    var checkCardsLength = (cards) ? cards.length : 0;
    for (var i = 0; i < this.wilds.length; i++) {
      if (this.wilds[i].rank > -1) continue;
      else if (cards) {
        if (this.game.wildStatus === 1 || cards[0].rank === values.length - 1) checkCardsLength += 1;
      } else if (this.game.wildStatus === 1 || val === values.length - 1) {
        checkCardsLength += 1;
      }
    }
    return checkCardsLength;
  }
  getCardsForFlush(suit, setRanks) {
    var cards = (this.suits[suit] || []).sort(Card.sort);
    for (var i = 0; i < this.wilds.length; i++) {
      var wild = this.wilds[i];
      if (setRanks) {
        var j = 0;
        while (j < values.length && j < cards.length) {
          if (cards[j].rank === values.length - 1 - j) j += 1;
          else break;
        }
        wild.rank = values.length - 1 - j;
        wild.wildValue = values[wild.rank];
      }
      cards.push(wild);
      cards = cards.sort(Card.sort);
    }
    return cards;
  }
  resetWildCards() {
    for (var i = 0; i < this.wilds.length; i++) {
      this.wilds[i].rank = -1;
      this.wilds[i].wildValue = this.wilds[i].value;
    }
  }
  nextHighest() {
    var picks;
    var excluding = [].concat(this.cards);
    picks = this.cardPool.filter(function(card) {
      return excluding.indexOf(card) < 0;
    });
    if (this.game.wildStatus === 0) {
      for (var i = 0; i < picks.length; i++) {
        var card = picks[i];
        if (card.rank === -1) { card.wildValue = 'A'; card.rank = values.length - 1; }
      }
      picks = picks.sort(Card.sort);
    }
    return picks;
  }
  toString() {
    return this.cards.map(function(c) { return c.toString(); }).join(', ');
  }
  toArray() {
    return this.cards.map(function(c) { return c.toString(); });
  }
  qualifiesHigh() {
    if (!this.game.lowestQualified || this.alwaysQualifies) return true;
    return (this.compare(Hand.solve(this.game.lowestQualified, this.game)) <= 0);
  }
  static winners(hands) {
    hands = hands.filter(function(h) { return h.qualifiesHigh(); });
    var highestRank = Math.max.apply(Math, hands.map(function(h) { return h.rank; }));
    hands = hands.filter(function(h) { return h.rank === highestRank; });
    hands = hands.filter(function(h) {
      var lose = false;
      for (var i = 0; i < hands.length; i++) { lose = h.loseTo(hands[i]); if (lose) break; }
      return !lose;
    });
    return hands;
  }
  static solve(cards, game, canDisqualify) {
    game = game || 'standard';
    game = (typeof game === 'string') ? new Game(game) : game;
    cards = cards || [''];
    var hands = game.handValues;
    var result = null;
    for (var i = 0; i < hands.length; i++) {
      result = new hands[i](cards, game, canDisqualify);
      if (result.isPossible) break;
    }
    return result;
  }
  static stripWilds(cards, game) {
    var card, wilds = [], nonWilds = [];
    cards = cards || [''];
    for (var i = 0; i < cards.length; i++) {
      card = cards[i];
      if (card.rank === -1) wilds.push(cards[i]);
      else nonWilds.push(cards[i]);
    }
    return [wilds, nonWilds];
  }
}

class StraightFlush extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Straight Flush', game, canDisqualify); }
  solve() {
    var cards;
    this.resetWildCards();
    var possibleStraight = null;
    var nonCards = [];
    for (var suit in this.suits) {
      cards = this.getCardsForFlush(suit, false);
      if (cards && cards.length >= this.game.sfQualify) { possibleStraight = cards; break; }
    }
    if (possibleStraight) {
      if (this.game.descr !== 'standard') {
        for (var suit in this.suits) {
          if (possibleStraight[0].suit !== suit) {
            nonCards = nonCards.concat(this.suits[suit] || []);
            nonCards = Hand.stripWilds(nonCards, this.game)[1];
          }
        }
      }
      var straight = new Straight(possibleStraight, this.game);
      if (straight.isPossible) {
        this.cards = straight.cards;
        this.cards = this.cards.concat(nonCards);
        this.sfLength = straight.sfLength;
      }
    }
    if (this.cards[0] && this.cards[0].rank === 13) this.descr = 'Royal Flush';
    else if (this.cards.length >= this.game.sfQualify) {
      this.descr = this.name + ', ' + this.cards[0].toString().slice(0, -1) + suit + ' High';
    }
    return this.cards.length >= this.game.sfQualify;
  }
}

class RoyalFlush extends StraightFlush {
  constructor(cards, game, canDisqualify) { super(cards, game, canDisqualify); }
  solve() { this.resetWildCards(); var result = super.solve(); return result && this.descr === 'Royal Flush'; }
}

class FourOfAKind extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Four of a Kind', game, canDisqualify); }
  solve() {
    this.resetWildCards();
    for (var i = 0; i < this.values.length; i++) {
      if (this.getNumCardsByRank(i) === 4) {
        this.cards = this.values[i] || [];
        for (var j = 0; j < this.wilds.length && this.cards.length < 4; j++) {
          var wild = this.wilds[j];
          if (this.cards) wild.rank = this.cards[0].rank;
          else wild.rank = values.length - 1;
          wild.wildValue = values[wild.rank];
          this.cards.push(wild);
        }
        this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - 4));
        break;
      }
    }
    if (this.cards.length >= 4) {
      if (this.game.noKickers) this.cards.length = 4;
      this.descr = this.name + ', ' + this.cards[0].toString().slice(0, -1) + '\'s';
    }
    return this.cards.length >= 4;
  }
}

class FullHouse extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Full House', game, canDisqualify); }
  solve() {
    var cards;
    this.resetWildCards();
    for (var i = 0; i < this.values.length; i++) {
      if (this.getNumCardsByRank(i) === 3) {
        this.cards = this.values[i] || [];
        for (var j = 0; j < this.wilds.length && this.cards.length < 3; j++) {
          var wild = this.wilds[j];
          if (this.cards) wild.rank = this.cards[0].rank;
          else wild.rank = values.length - 1;
          wild.wildValue = values[wild.rank];
          this.cards.push(wild);
        }
        break;
      }
    }
    if (this.cards.length === 3) {
      for (i = 0; i < this.values.length; i++) {
        cards = this.values[i];
        if (cards && this.cards[0].wildValue === cards[0].wildValue) continue;
        if (this.getNumCardsByRank(i) >= 2) {
          this.cards = this.cards.concat(cards || []);
          for (var j = 0; j < this.wilds.length; j++) {
            var wild = this.wilds[j];
            if (wild.rank !== -1) continue;
            if (cards) wild.rank = cards[0].rank;
            else if (this.cards[0].rank === values.length - 1 && this.game.wildStatus === 1) wild.rank = values.length - 2;
            else wild.rank = values.length - 1;
            wild.wildValue = values[wild.rank];
            this.cards.push(wild);
          }
          this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - 5));
          break;
        }
      }
    }
    if (this.cards.length >= 5) {
      var type = this.cards[0].toString().slice(0, -1) + '\'s over ' + this.cards[3].toString().slice(0, -1) + '\'s';
      this.descr = this.name + ', ' + type;
    }
    return this.cards.length >= 5;
  }
}

class Flush extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Flush', game, canDisqualify); }
  solve() {
    this.sfLength = 0;
    this.resetWildCards();
    var suit;
    for (suit in this.suits) {
      var cards = this.getCardsForFlush(suit, true);
      if (cards.length >= this.game.sfQualify) { this.cards = cards; break; }
    }
    if (this.cards.length >= this.game.sfQualify) {
      this.descr = this.name + ', ' + this.cards[0].toString().slice(0, -1) + suit + ' High';
      this.sfLength = this.cards.length;
      if (this.cards.length < this.game.cardsInHand)
        this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - this.cards.length));
    }
    return this.cards.length >= this.game.sfQualify;
  }
}

class Straight extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Straight', game, canDisqualify); }
  solve() {
    var card;
    this.resetWildCards();
    this.cards = this.getGaps();
    for (var i = 0; i < this.wilds.length; i++) {
      card = this.wilds[i];
      var checkCards = this.getGaps(this.cards.length);
      if (this.cards.length === checkCards.length) {
        if (this.cards[0].rank < (values.length - 1)) { card.rank = this.cards[0].rank + 1; card.wildValue = values[card.rank]; this.cards.push(card); }
        else { card.rank = this.cards[this.cards.length - 1].rank - 1; card.wildValue = values[card.rank]; this.cards.push(card); }
      } else {
        for (var j = 1; j < this.cards.length; j++) {
          if (this.cards[j - 1].rank - this.cards[j].rank > 1) {
            card.rank = this.cards[j - 1].rank - 1; card.wildValue = values[card.rank]; this.cards.push(card); break;
          }
        }
      }
      this.cards = this.cards.sort(Card.sort);
    }
    if (this.cards.length >= this.game.sfQualify) {
      this.descr = this.name + ', ' + this.cards[0].toString().slice(0, -1) + ' High';
      this.cards = this.cards.slice(0, this.game.cardsInHand);
      this.sfLength = this.cards.length;
      if (this.cards.length < this.game.cardsInHand) {
        if (this.cards[this.sfLength - 1].rank === 0)
          this.cards = this.cards.concat(this.nextHighest().slice(1, this.game.cardsInHand - this.cards.length + 1));
        else
          this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - this.cards.length));
      }
    }
    return this.cards.length >= this.game.sfQualify;
  }
  getGaps(checkHandLength) {
    var i, card, gapCards, cardsList, gapCount, prevCard, diff;
    var stripReturn = Hand.stripWilds(this.cardPool, this.game);
    var wildCards = stripReturn[0];
    var cardsToCheck = stripReturn[1];
    for (i = 0; i < cardsToCheck.length; i++) {
      card = cardsToCheck[i];
      if (card.wildValue === 'A') cardsToCheck.push(new Card('1' + card.suit));
    }
    cardsToCheck = cardsToCheck.sort(Card.sort);
    if (checkHandLength) { i = cardsToCheck[0].rank + 1; }
    else { checkHandLength = this.game.sfQualify; i = values.length; }
    gapCards = [];
    for (; i > 0; i--) {
      cardsList = []; gapCount = 0;
      for (var j = 0; j < cardsToCheck.length; j++) {
        card = cardsToCheck[j];
        if (card.rank > i) continue;
        prevCard = cardsList[cardsList.length - 1];
        diff = (prevCard) ? prevCard.rank - card.rank : i - card.rank;
        if (diff === null) cardsList.push(card);
        else if (checkHandLength < (gapCount + diff + cardsList.length)) break;
        else if (diff > 0) { cardsList.push(card); gapCount += (diff - 1); }
      }
      if (cardsList.length > gapCards.length) gapCards = cardsList.slice();
      if (this.game.sfQualify - gapCards.length <= wildCards.length) break;
    }
    return gapCards;
  }
}

class ThreeOfAKind extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Three of a Kind', game, canDisqualify); }
  solve() {
    this.resetWildCards();
    for (var i = 0; i < this.values.length; i++) {
      if (this.getNumCardsByRank(i) === 3) {
        this.cards = this.values[i] || [];
        for (var j = 0; j < this.wilds.length && this.cards.length < 3; j++) {
          var wild = this.wilds[j];
          if (this.cards) wild.rank = this.cards[0].rank;
          else wild.rank = values.length - 1;
          wild.wildValue = values[wild.rank];
          this.cards.push(wild);
        }
        this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - 3));
        break;
      }
    }
    if (this.cards.length >= 3) {
      if (this.game.noKickers) this.cards.length = 3;
      this.descr = this.name + ', ' + this.cards[0].toString().slice(0, -1) + '\'s';
    }
    return this.cards.length >= 3;
  }
}

class TwoPair extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Two Pair', game, canDisqualify); }
  solve() {
    this.resetWildCards();
    for (var i = 0; i < this.values.length; i++) {
      var cards = this.values[i];
      if (this.cards.length > 0 && this.getNumCardsByRank(i) === 2) {
        this.cards = this.cards.concat(cards || []);
        for (var j = 0; j < this.wilds.length; j++) {
          var wild = this.wilds[j];
          if (wild.rank !== -1) continue;
          if (cards) wild.rank = cards[0].rank;
          else if (this.cards[0].rank === values.length - 1 && this.game.wildStatus === 1) wild.rank = values.length - 2;
          else wild.rank = values.length - 1;
          wild.wildValue = values[wild.rank];
          this.cards.push(wild);
        }
        this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - 4));
        break;
      } else if (this.getNumCardsByRank(i) === 2) {
        this.cards = this.cards.concat(cards);
        for (var j = 0; j < this.wilds.length; j++) {
          var wild = this.wilds[j];
          if (wild.rank !== -1) continue;
          if (cards) wild.rank = cards[0].rank;
          else if (this.cards[0].rank === values.length - 1 && this.game.wildStatus === 1) wild.rank = values.length - 2;
          else wild.rank = values.length - 1;
          wild.wildValue = values[wild.rank];
          this.cards.push(wild);
        }
      }
    }
    if (this.cards.length >= 4) {
      if (this.game.noKickers) this.cards.length = 4;
      var type = this.cards[0].toString().slice(0, -1) + '\'s & ' + this.cards[2].toString().slice(0, -1) + '\'s';
      this.descr = this.name + ', ' + type;
    }
    return this.cards.length >= 4;
  }
}

class OnePair extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'Pair', game, canDisqualify); }
  solve() {
    this.resetWildCards();
    for (var i = 0; i < this.values.length; i++) {
      if (this.getNumCardsByRank(i) === 2) {
        this.cards = this.cards.concat(this.values[i] || []);
        for (var j = 0; j < this.wilds.length && this.cards.length < 2; j++) {
          var wild = this.wilds[j];
          if (this.cards) wild.rank = this.cards[0].rank;
          else wild.rank = values.length - 1;
          wild.wildValue = values[wild.rank];
          this.cards.push(wild);
        }
        this.cards = this.cards.concat(this.nextHighest().slice(0, this.game.cardsInHand - 2));
        break;
      }
    }
    if (this.cards.length >= 2) {
      if (this.game.noKickers) this.cards.length = 2;
      this.descr = this.name + ', ' + this.cards[0].toString().slice(0, -1) + '\'s';
    }
    return this.cards.length >= 2;
  }
}

class HighCard extends Hand {
  constructor(cards, game, canDisqualify) { super(cards, 'High Card', game, canDisqualify); }
  solve() {
    this.cards = this.cardPool.slice(0, this.game.cardsInHand);
    for (var i = 0; i < this.cards.length; i++) {
      if (this.cards[i].value === this.game.wildValue) {
        this.cards[i].wildValue = 'A'; this.cards[i].rank = values.indexOf('A');
      }
    }
    if (this.game.noKickers) this.cards.length = 1;
    this.cards = this.cards.sort(Card.sort);
    this.descr = this.cards[0].toString().slice(0, -1) + ' High';
    return true;
  }
}

const gameRules = {
  'standard': {
    cardsInHand: 5,
    handValues: [StraightFlush, FourOfAKind, FullHouse, Flush, Straight, ThreeOfAKind, TwoPair, OnePair, HighCard],
    wildValue: null, wildStatus: 1, wheelStatus: 0, sfQualify: 5, lowestQualified: null, noKickers: false
  }
};

class Game {
  constructor(descr) {
    this.descr = descr;
    if (!this.descr || !gameRules[this.descr]) this.descr = 'standard';
    this.cardsInHand = gameRules[this.descr].cardsInHand;
    this.handValues = gameRules[this.descr].handValues;
    this.wildValue = gameRules[this.descr].wildValue;
    this.wildStatus = gameRules[this.descr].wildStatus;
    this.wheelStatus = gameRules[this.descr].wheelStatus;
    this.sfQualify = gameRules[this.descr].sfQualify;
    this.lowestQualified = gameRules[this.descr].lowestQualified;
    this.noKickers = gameRules[this.descr].noKickers;
  }
}

export { Hand, Card, Game };
