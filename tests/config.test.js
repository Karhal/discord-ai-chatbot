/* eslint-disable no-undef */
import config from './../src/config';

it('config require exist', async () => {
  expect(config).toEqual(
    expect.objectContaining({
      discord: expect.any(Object),
      openAI: expect.any(Object)
    })
  );

  expect(config.discord).toEqual(
    expect.objectContaining({
      token: expect.any(String)
    })
  );

  expect(config.openAI).toEqual(
    expect.objectContaining({
      apiKey: expect.any(String)
    })
  );
});
