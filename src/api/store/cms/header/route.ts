import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import StrapiModuleService from '../../../../modules/strapi/service';

type CMSBody = {
  populate: string | string[] | Record<string, unknown> | undefined;
};

export async function GET(req: MedusaRequest<CMSBody>, res: MedusaResponse) {
  const strapi = req.scope.resolve<StrapiModuleService>('strapi');
  try {
    const { locale = '' } = req.query;
    const { populate } = req.body;

    const data = await strapi.getHeader(locale as string, populate);

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: 'An error occurred while fetching the headers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
