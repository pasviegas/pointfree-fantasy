require('../pointfree').expose(global)


var Maybe = require('../instances/maybe')
  , Just = Maybe.Just
  , Nothing = Maybe.Nothing
  , assert = require("assert")
  , quickCheckLaws = require('./helper').quickCheckLaws
  , curry = require('lodash.curry')
  , claire = require('claire')
  , _ = claire.data
  , forAll = claire.forAll
  ;

var pluck = curry(function(x, o) { return o[x]; });

var safeGet = curry(function(x, o) { return Maybe(o[x]); });

var add = curry(function(x, y) { return x + y; });

var user = {email: "sally@test.com", address: {street: {number: 23, name: "Winston"}}}

var MaybeGen = claire.transform(Maybe, _.Any);
var MaybeMonoidGen = claire.transform(Maybe, _.Str);

describe('Maybe', function(){
  quickCheckLaws({ 'Semigroup': MaybeMonoidGen
                 , 'Monoid': MaybeMonoidGen
                 , 'Functor': MaybeGen
                 , 'Applicative': MaybeMonoidGen
                 , 'Monad': MaybeGen
                 });

  describe('Monoid', function(){
    it('ignores the nulls and combines the contained monoid', function() {
      assert.deepEqual(mconcat([Just("hi, "), Nothing(), Just("guy")]), Just("hi, guy"));
    });
  });

  describe('Functor', function(){
    it('works with fmap', function(){
      var getStreet = compose(fmap(add('my email is ')), safeGet('email'));
      assert.deepEqual(getStreet(user), Just('my email is sally@test.com'));
    });
  });

  describe('Applicative', function(){
    it('runs if values are present', function() {
      assert.deepEqual(Just(add('yo ')).ap(Just('dawg')), Just('yo dawg'));
    });

    it('fails on null', function() {
      assert.deepEqual(Just(add('yo ')).ap(Just('dawg')).ap(Nothing()), Nothing());
    });

    it('applys the function to the value within the context of Maybe', function() {
      assert.deepEqual(ap(Just(add(2)), Just(3)), Just(5));
    });

    it('lifts a function into the maybe context', function() {
      assert.deepEqual(liftA2(add, Just(2), Just(3)), Just(5));
    });
  });

  describe('Monad', function(){
    var flatSafeTraverseStreetName = compose( mjoin
                                            , fmap(safeGet('name'))
                                            , mjoin
                                            , fmap(safeGet('street'))
                                            , safeGet('address')
                                            );

    it('flattens the nested fmaps', function(){
      var user = {email: "sally@test.com", address: {street: {number: 23, name: "Winston"}}}
      assert.deepEqual(flatSafeTraverseStreetName(user), Just('Winston'));
    })

    it('fails if null', function(){
      var user = {email: "sally@test.com", address: null}
      assert.deepEqual(flatSafeTraverseStreetName(user), Nothing());
    })

    it('binds a value to the function', function(){
      var result = mbind(Just(3), function(three){
        return mbind(Just(4), function(four){
          return Just(three + four);
        })
      });
      assert.deepEqual(result, Just(7));
    })
  });
});
