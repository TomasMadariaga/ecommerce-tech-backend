module.exports = {
  async index(ctx) {
    ctx.send({ status: 'ok', timestamp: new Date() }, 200);
  },
};
