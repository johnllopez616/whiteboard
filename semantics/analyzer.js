const {
  Arg, Array, Assignment, Break, BinaryExp, Conditional, Call, Declaration, TypeDec,
  ForLoop, ForIncrement, Postfix, Program, Func, Literal, WhileLoop,
} = require('../ast');

const { CounterType, WorderType, YesnosType } = require('./builtins');
const check = require('./check');

Arg.prototype.analyze = function (context) {
  this.type = context.lookup(this.type);
  this.id = context.lookup(this.id); // I think this is right?
};

Array.prototype.analyze = function (context) {
  if (!this === null) {
    const newContext = context.createChildContextForBlock();
    this.args.forEach(line => line.analyze(newContext));
  }
};

Assignment.prototype.analyze = function (context) {
  check.isMutable(this.target);
  this.target = context.lookup(this.target);
  this.source.analyze(context);
};

BinaryExp.prototype.analyze = function (context) {
  if (this.left instanceof Literal) {
    this.left.analyze(context);
  }
  if (this.right instanceof Literal) {
    this.right.analyze(context);
  }
  if (this.op === 'RIP' || this.op === 'SQUISH' || this.op === 'MANY'
  || this.op === 'LEFT' || this.op === 'CUT') {
    check.isInteger(this.left);
    this.left.type = CounterType;
    check.isInteger(this.right);
    this.right.type = CounterType;
  } else if (this.op === 'OOGA') {
    check.isBoolean(this.left);
    this.type = YesnosType;
  } else if (this.op === 'NOOGA') {
    check.isBoolean(this.left);
    this.type = YesnosType;
  }
};

Break.prototype.analyze = function (context) {
  check.inLoop(context);
};

Conditional.prototype.analyze = function (context) {
  this.testExp.analyze(context);
  const consequentContext = context.createChildContextForBlock();
  this.consequent.forEach(line => line.analyze(consequentContext));
  if (this.alternate) {
    const alternateContext = context.createChildContextForBlock();
    this.alternate.forEach(line => line.analyze(alternateContext));
  }
  if (this.final) {
    const finalContext = context.createChildContextForBlock();
    this.final.forEach(line => line.analyze(finalContext));
  }
};

Call.prototype.analyze = function (context) {
  if (context.locals.has(this.id)) {
    const match = context.locals.get(this.id);
    this.type = match.type;
  }
  context.lookup(this.id);
};

Declaration.prototype.analyze = function (context) {
  context.add(this);

  check.mutabilityCheck(this.mutability);
  this.typeDec.analyze(context);
  if (this.exp !== 'OOGA' && this.exp !== 'NOOGA') {
    this.exp.analyze(context);
  }
};

ForLoop.prototype.analyze = function (context) {
  this.setup.analyze(context);
  this.testExp.analyze(context);
  context.add(this.setup.id);
  this.increment.analyze(context);
  const bodyContext = context.createChildContextForLoop();
  this.body.forEach(line => line.analyze(bodyContext));
};

ForIncrement.prototype.analyze = function (context) {
  this.id1 = context.lookup(this.id1);
  this.id2 = context.lookup(this.id2);
  this.intlit.analyze(context);
};

Func.prototype.analyze = function (context) {
  const paramContext = context.createChildContextForBlock();
  if (!this.params === null) {
    this.params.forEach(line => line.analyze(paramContext));
  }

  if (!this.statements === null) {
    this.statements.forEach(line => line.analyze(paramContext));
  }
};

Literal.prototype.analyze = function (/* context */) {
//  check.isMutable(this.type);
  if (typeof this.value === 'number') {
    this.type = CounterType;
  } else if (this.value === 'OOGA' || this.value === 'NOOGA') {
    this.type = YesnosType;
  } else if (typeof this.value === 'string') {
    this.type = WorderType;
  }
};


Program.prototype.analyze = function (context) {
  this.statements.forEach(s => s.analyze(context));
};

Postfix.prototype.analyze = function (context) {
  this.left.analyze(context);
};

TypeDec.prototype.analyze = function (context) {
  if ((this.op === 'RIP') | (this.op === 'SQUISH') | (this.op === 'MANY')) {
    check.isInteger(this.left);
    check.isInteger(this.right);
    this.type = CounterType;
  }
  if (!this.array === null) {
    this.array.analyze(context);
  }
};

WhileLoop.prototype.analyze = function (context) {
  this.testExp.analyze(context);
  const bodyContext = context.createChildContextForLoop();
  this.body.forEach(line => line.analyze(bodyContext));
};
