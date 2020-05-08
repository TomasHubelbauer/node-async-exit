# Node Asynchronous `exit` Hook

In Node, one can listen to the process' exit using the `process.on('exit')`
hook.

In this repository I am exploring the following:

## Can the listener be `async/await`?

```js
process.on('exit', async code => await fs.appendFile('log.json', JSON.stringify({ code }) + '\n'));
```

This will not work - the hook will be called, but the file will not be written.

## Will it work if we fire and forget the promise?

```js
process.on('exit', code => fs.appendFile('log.json', JSON.stringify({ code }) + '\n'));
```

This will not work either, the promise will not be awaited and there is not
enough time between the hook is invoked and the process it ripped down for the
floated promise to make it. Even if this worker, at least sometimes, it would be
an abuse of a race condition which would not be sufficiently reliable.

## Must the hook only be sync for it to be reliably called?

```js
process.on('exit', code => fs.appendFileSync('log.json', JSON.stringify({ code }) + '\n'));
```

It appears so.

## Is exit called if you kill the process manually?

So far we've explored the Node runtime invoking the `exit` listener after the
script has finished running. What if we create a long-running script and kill it
manually from the outside of the process?

```js
void async function () {
  await log('Running…');
  setTimeout(async () => await log('Timeout done'), 5000);
  console.log('Self PID:', process.pid);
}()
```

If you run this and then press Ctrl+C in the terminal, the exit hook will not be
called!

The same is true for when it gets terminated from the outside, e.g. on Windows
using `taskkill`: `taskkill /pid ${id} /f`.

By adding a signal handler:

```js
process.on('SIGINT', signal => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Signal ${signal}` }) + '\n'));
```

We can capture (and prevent, actually) Ctrl+C in the terminal where the process
was ran.

Killing the process will still not result in any hook being called. I also tried
`sigquit`, `sigterm` and `sigkill` but was unable to catch the process being
terminated on Windows.

The `death` package claims `sigterm` is the signal to listen to for this:

https://www.npmjs.com/package/death#signals

But I am unable to confirm it.

Death is unable to catch this, too. I think this is because I am forced to use
the `-f` flag, which might be because the process it preventing itself from
being killed (perhaps due to the use of `setTimeout`?), if it was more receptive
to it, it might not resist to running these hooks and would capture even the
external kill. I am not sure what to change though to make this work.

## Conclusion

This is expected, but unfortunate, as a single implementation of a loggin (or
whatever other async) function cannot be reused and must be reimplemented in a
sync manner for this one case of the exit handler.

## To-Do

### Try blocking on a long-running `fetch` instead of a timeout and see if it helps

Maybe with that, the process will actually service the pre-death hooks.
