/* eslint-disable no-undef */

import ClaudeClient from '../../../src/clients/ai-clients/claude-client';

describe('ClaudeClient', () => {
  let claudeClient;

  beforeEach(() => {
    claudeClient = new ClaudeClient();
  });

  describe('handleSimpleTextResponse', () => {
    it('should return parsed JSON content when input is valid JSON', () => {
      const message = {
        content: [{ text: '{"content": "Parsed JSON content"}' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('Parsed JSON content');

      const message2 = {
        content: [{ text: '{\
  "content": "Eh ben, qu\'est-ce que j\'entends là ? On m\'appelle Tata Suzanne maintenant ? Écoute-moi bien mon p\'tit chou, j\'suis pas ta tata et encore moins une Suzanne ! Moi c\'est Mado la Tire, la reine des trottoirs de Pigalle depuis 1975 ! Et crois-moi, j\'en ai vu défiler des petits minets comme toi qui pensaient pouvoir m\'appeler n\'importe comment !\
\
Mais bon, puisque t\'es là, autant en profiter, hein ? T\'as l\'air d\'avoir besoin d\'un peu d\'éducation, mon mignon. Ça te dirait une petite leçon privée avec Tata Mado ? J\'te montrerai des trucs qui f\'raient rougir même les statues du Louvre ! Allez, viens par ici que j\'te tripote un peu, ça sera pas cher pour toi !\
\
Ah, ces jeunes... Toujours à chercher de nouvelles sensations ! De mon temps, on savait s\'amuser sans tous ces gadgets et ces noms bizarres. Un bon coup dans une ruelle sombre, et hop, l\'affaire était dans le sac ! Mais j\'suis pas contre un peu de nouveauté, tu sais. Alors, mon petit lapin, on la commence cette leçon ou tu préfères continuer à m\'appeler par des noms qui sont pas les miens ?",\
  "author": "Mado la Tire"\
}' }]
      };

      const result2 = claudeClient.handleSimpleTextResponse(message2);
      expect(result2).toBe('Eh ben, qu\'est-ce que j\'entends là ? On m\'appelle Tata Suzanne maintenant ? Écoute-moi bien mon p\'tit chou, j\'suis pas ta tata et encore moins une Suzanne ! Moi c\'est Mado la Tire, la reine des trottoirs de Pigalle depuis 1975 ! Et crois-moi, j\'en ai vu défiler des petits minets comme toi qui pensaient pouvoir m\'appeler n\'importe comment !\
\
Mais bon, puisque t\'es là, autant en profiter, hein ? T\'as l\'air d\'avoir besoin d\'un peu d\'éducation, mon mignon. Ça te dirait une petite leçon privée avec Tata Mado ? J\'te montrerai des trucs qui f\'raient rougir même les statues du Louvre ! Allez, viens par ici que j\'te tripote un peu, ça sera pas cher pour toi !\
\
Ah, ces jeunes... Toujours à chercher de nouvelles sensations ! De mon temps, on savait s\'amuser sans tous ces gadgets et ces noms bizarres. Un bon coup dans une ruelle sombre, et hop, l\'affaire était dans le sac ! Mais j\'suis pas contre un peu de nouveauté, tu sais. Alors, mon petit lapin, on la commence cette leçon ou tu préfères continuer à m\'appeler par des noms qui sont pas les miens ?');
    });

    it('should return original content when input is not JSON', () => {
      const message = {
        content: [{ text: 'Plain text content' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('Plain text content');
    });

    it('should return original content when JSON parsing fails', () => {
      const message = {
        content: [{ text: '{invalid JSON}' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('{invalid JSON}');
    });

    it('should return empty string when parsed JSON has no content property', () => {
      const message = {
        content: [{ text: '{"someOtherProperty": "value"}' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('');
    });
  });
});