import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

import { gotClient } from './utils';
import charset from './charset';

/**
 * performs the got request and formats the body for ogs
 *
 * @param {object} gotOptions - options for got
 * @param {object} ogsOptions - options for ogs
 * @return {object} formatted request body and response
 *
 */
export default async function requestAndResultsFormatter(gotOptions, ogsOptions) {
  const got = await gotClient(ogsOptions.downloadLimit);

  return got(gotOptions)
    .then((response) => {
      if (response && response.headers && response.headers['content-type'] && !response.headers['content-type'].includes('text/')) {
        throw new Error('Page must return a header content-type with text/');
      }

      if (response && response.statusCode && (response.statusCode.toString().substring(0, 1) === '4' || response.statusCode.toString().substring(0, 1) === '5')) {
        throw new Error('Server has returned a 400/500 error code');
      }

      if (response.body === undefined || response.body === '') {
        throw new Error('Page not found');
      }

      const char = charset(response.headers, response.rawBody, ogsOptions.peekSize) || chardet.detect(response.rawBody);
      let decodedBody = response.rawBody.toString();
      if (char && typeof response.rawBody === 'object') {
        decodedBody = iconv.decode(response.rawBody, char);
      }

      if (!decodedBody) {
        throw new Error('Page not found');
      }

      return { decodedBody, response };
    })
    .catch((error) => {
      if (error instanceof Error) throw error;
      throw new Error(error);
    });
}
