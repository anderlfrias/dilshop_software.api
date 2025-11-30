/**
 * OrdenController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
  listar: async function (req, res) {
    try {
      // Obtener los registros de caja (facturaciones) abiertas
      const registroCajas = await RegistroCaja.find().where({ estado: 'abierta', deleted: false })
        .populate('cajaId')
        .sort([
          { fechaApertura: 'DESC' }
        ]);

      if (!registroCajas) {
        return res.badRequest({ err: 'No existen registros de caja' });
      }

      // Obtener las prefacturas de cada registro de caja
      let prefacturas = [];
      for (let i = 0; i < registroCajas.length; i++) {
        const element = registroCajas[i];
        const prefacturasRegistroCaja = await PreFactura.find().where({ registroCajaId: element.id, deleted: false, estado: 'Abierta' })
          .populate('mesaId')
          .populate('clienteId')
          .sort([
            { createdAt: 'DESC' }
          ]);

        if (!prefacturasRegistroCaja) {
          continue;
        }

        prefacturas = prefacturas.concat(prefacturasRegistroCaja);
      }

      // Eliminar prefacturas sin mesa
      prefacturas = prefacturas.filter(prefactura => prefactura.mesaId);
      // console.log(prefacturas);

      // Obtener los productos de cada prefactura
      for (let i = 0; i < prefacturas.length; i++) {
        const element = prefacturas[i];

        const productosPrefactura = await PreFacturaProducto.find().where({ preFacturaId: element.id, deleted: false })
          .populate('productoId');

        if (!productosPrefactura) {
          continue;
        }

        prefacturas[i].productos = productosPrefactura;
      }

      return res.ok(prefacturas);
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las ordenes.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'OrdenController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(err);
    }
  }

};

