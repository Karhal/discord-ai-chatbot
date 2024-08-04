/* eslint-disable no-undef */
import * as Wrap from './../src/console-logger';

it('log error message if config contain ERROR', async () => {
  Wrap.ConsoleLogger.states = ['ERROR'];
  const consoleSpy = jest.spyOn(console, 'log');
  const spy = jest.spyOn(Wrap.ConsoleLogger, 'log');
  Wrap.ConsoleLogger.log('ERROR', 'test');
  expect(spy).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith('test');
});

it('don\'t log error message if config doesn\'t contain ERROR', async () => {
  Wrap.ConsoleLogger.states = ['INFOS', 'CALL'];
  const consoleSpy = jest.spyOn(console, 'log');
  const spy = jest.spyOn(Wrap.ConsoleLogger, 'log');
  Wrap.ConsoleLogger.log('ERROR', 'test');
  expect(spy).toHaveBeenCalled();
  expect(consoleSpy).not.toHaveBeenCalledWith('test');
});

it('log verbose message if config contain VERBOSE', async () => {
  Wrap.ConsoleLogger.states = ['VERBOSE'];
  const consoleSpy = jest.spyOn(console, 'log');
  const spy = jest.spyOn(Wrap.ConsoleLogger, 'log');
  Wrap.ConsoleLogger.log('VERBOSE', 'test');
  expect(spy).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith('test');
});

it('don\'t log verbose message if config doesn\'t contain VERBOSE', async () => {
  Wrap.ConsoleLogger.states = ['INFOS', 'CALL'];
  const consoleSpy = jest.spyOn(console, 'log');
  const spy = jest.spyOn(Wrap.ConsoleLogger, 'log');
  Wrap.ConsoleLogger.log('VERBOSE', 'test');
  expect(spy).toHaveBeenCalled();
  expect(consoleSpy).not.toHaveBeenCalledWith('test');
});
