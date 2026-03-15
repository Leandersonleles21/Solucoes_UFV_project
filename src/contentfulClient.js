/**
 * Configuração do cliente Contentful
 * 
 * Este arquivo centraliza a conexão com o Contentful CMS.
 * As credenciais são lidas das variáveis de ambiente (arquivo .env)
 */

import { createClient } from 'contentful';

// Validação das variáveis de ambiente
const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
const accessToken = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;

if (!spaceId || spaceId === 'cole_seu_space_id_aqui') {
  console.warn('⚠️ VITE_CONTENTFUL_SPACE_ID não configurado no arquivo .env');
}

if (!accessToken || accessToken === 'cole_seu_access_token_aqui') {
  console.warn('⚠️ VITE_CONTENTFUL_ACCESS_TOKEN não configurado no arquivo .env');
}

// Criação do cliente Contentful
const contentfulClient = createClient({
  space: spaceId,
  accessToken: accessToken,
});

export default contentfulClient;

/**
 * Função auxiliar para buscar entradas do Contentful
 * @param {string} contentType - O tipo de conteúdo a buscar
 * @param {object} options - Opções adicionais de query
 * @returns {Promise} - Promise com os resultados
 */
export async function getEntries(contentType, options = {}) {
  try {
    const response = await contentfulClient.getEntries({
      content_type: contentType,
      ...options,
    });
    return response.items;
  } catch (error) {
    console.error(`Erro ao buscar ${contentType}:`, error);
    return [];
  }
}

/**
 * Função auxiliar para buscar uma entrada específica
 * @param {string} entryId - O ID da entrada
 * @returns {Promise} - Promise com a entrada
 */
export async function getEntry(entryId) {
  try {
    const entry = await contentfulClient.getEntry(entryId);
    return entry;
  } catch (error) {
    console.error(`Erro ao buscar entrada ${entryId}:`, error);
    return null;
  }
}
