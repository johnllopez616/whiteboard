/* Taken from Tiger
 *
 * Semantic Analysis Context
 *
 * A context object holds state for the semantic analysis phase.
 *
 *   const Context = require('./semantics/context');
 */

const {

  CounterType,
  WorderType,
  YesnosType,
  standardFunctions,
  // WhatType,
  // TabletType,
} = require('./builtins');
require('./analyzer');

// When doing semantic analysis we pass around context objects.
//
// A context object holds:
//
//   1. A reference to the parent context (or null if this is the root context).
//      This allows to search for declarations from the current context outward.
//
//   2. A reference to the current function we are analyzing, if any. If we are
//      inside a function, then return expressions are legal, and we will be
//      able to type check them.
//
//   3. Whether we are in a loop (to know that a `break` is okay).

class Context {
  constructor({ parent = null, currentFunction = null, inLoop = false } = {}) {
    Object.assign(this, {
      parent,
      currentFunction,
      inLoop,
      locals: new Map(),
    });
  }

  /* createChildContextForFunctionBody(currentFunction) {
    // When entering a new function, we're not in a loop anymore
    return new Context({ parent: this, currentFunction, inLoop: false });
  } */

  createChildContextForLoop() {
    // When entering a loop body, just set the inLoop field, retain others
    return new Context({ parent: this, currentFunction: this.currentFunction, inLoop: true });
  }

  createChildContextForBlock() {
    // For a block, we have to retain both the function and loop settings.
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: this.inLoop,
    });
  }

  // Adds a variable or function to this context.
  add(declaration) {
    if (this.locals.has(declaration.id)) {
      throw new Error(`${declaration} already declared in this scope`);
    }
    this.locals.set(declaration.id, declaration);
  }

  lookup(id) {
    for (let context = this; context !== null; context = context.parent) {
      if (context.locals.has(id)) {
        return context.locals.get(id);
      }
    }
    throw new Error(`Identifier ${id} has not been declared`);
  }
}

Context.INITIAL = new Context();
[CounterType,
  WorderType,
  YesnosType,
  // WhatType,
  // TabletType,
  ...standardFunctions,
].forEach((f) => { Context.INITIAL.add(f); });

module.exports = Context;
