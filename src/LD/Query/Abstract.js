'use strict'

class LDBucketQuery {
  constructor(bucket) {
    if(!bucket)
      throw new Error("Pass a valid bucket to initialize the interface.");
    this._db = bucket;
    return this;
  }
  bySubject(){
    throw new Error("Abstract method.")
  }
  byPredicate(){
    throw new Error("Abstract method.")
  }
  byObject(){
    throw new Error("Abstract method.")
  }
  byTriple(){
    throw new Error("Abstract method.")
  }
}

module.exports = LDBucketQuery;
