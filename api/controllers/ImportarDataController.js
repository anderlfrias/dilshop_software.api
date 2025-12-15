/**
 * ImportarDataController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require('fs');
const { parse } = require('csv-parse');

const getMedida = (medida) => {
  if (medida === '1') {
    return 'und';
  }

  return medida.toLowerCase();
};


module.exports = {
  productos: async function (req, res) {
    try {
      let impuestos = [];
      let suplidores = [];
      let marcas = [];

      const generarCodigoAleatorio = () => {
        // Genera un número aleatorio entre 1000 y 9999
        const codigo = Math.floor(Math.random() * 900000) + 100000;
        return codigo;
      };

      const validarCodigo = (codigo, productos) => {
        const productoEncontrado = productos.find(producto => producto.codigo === codigo);
        if (productoEncontrado) {
          return validarCodigo(generarCodigoAleatorio(), productos);
        }

        return codigo;
      };

      const getTipoImpuesto = async (tipoImpuesto, { db, proceed }) => {
        if (tipoImpuesto === 'PRODUCTOS EXENTOS') {
          if (impuestos.find(impuesto => impuesto.porcentaje === 0)) {
            return impuestos.find(impuesto => impuesto.porcentaje === 0).id;
          }

          const impuestoEncontrado = await TipoImpuesto.find({ porcentaje: 0 }).limit(1);
          if (impuestoEncontrado.length > 0) {
            impuestos = [...impuestos, { id: impuestoEncontrado[0].id, porcentaje: impuestoEncontrado[0].porcentaje }];
            return impuestoEncontrado[0].id;
          }

          const impuesto = await TipoImpuesto.create({
            id: await sails.helpers.objectId(),
            descripcion: 'Exentos',
            porcentaje: 0,
          }).fetch().usingConnection(db);

          if (!impuesto) {
            return proceed(new Error('Ocurrió un error al crear el impuesto'));
          }

          impuestos = [...impuestos, { id: impuesto.id, porcentaje: impuesto.porcentaje }];
          return impuesto.id;
        }

        if (impuestos.find(impuesto => impuesto.porcentaje === 18)) {
          return impuestos.find(impuesto => impuesto.porcentaje === 18).id;
        }

        const impuestoEncontrado = await TipoImpuesto.find({ porcentaje: 18 }).limit(1);
        if (impuestoEncontrado.length > 0) {
          impuestos = [...impuestos, { id: impuestoEncontrado[0].id, porcentaje: impuestoEncontrado[0].porcentaje }];
          return impuestoEncontrado[0].id;
        }

        const impuesto = await TipoImpuesto.create({
          id: await sails.helpers.objectId(),
          descripcion: 'Grabados con el 18%',
          porcentaje: 18,
        }).fetch().usingConnection(db);

        if (!impuesto) {
          return proceed(new Error('Ocurrió un error al crear el impuesto'));
        }
        impuestos = [...impuestos, { id: impuesto.id, porcentaje: impuesto.porcentaje }];
        return impuesto.id;
      };

      const getSuplidorId = async (nombreSuplidor, { db, proceed }) => {
        if (!nombreSuplidor || nombreSuplidor === 'NULL') {
          return null;
        }
        const suplidorEnArray = suplidores.find(suplidor => suplidor.nombre.toLowerCase() === nombreSuplidor.toLowerCase());
        if (suplidorEnArray) {
          return suplidorEnArray.id;
        }

        const suplidorEncontrado = await Suplidor.find().where({ nombre: nombreSuplidor, deleted: false }).limit(1);
        if (suplidorEncontrado.length > 0) {
          suplidores = [...suplidores, { id: suplidorEncontrado[0].id, nombre: suplidorEncontrado[0].nombre }];
          return suplidorEncontrado[0].id;
        }
        const suplidorCreado = await Suplidor.create({ id: await sails.helpers.objectId(), nombre: nombreSuplidor }).fetch().usingConnection(db);

        if (!suplidorCreado) {
          return proceed(new Error('Ocurrió un error al crear el suplidor'));
        }

        suplidores = [...suplidores, { id: suplidorCreado.id, nombre: suplidorCreado.nombre }];
        return suplidorCreado.id;
      };

      const getMarcaId = async (nombreMarca, { db, proceed }) => {
        if (!nombreMarca || nombreMarca === 'NULL') {
          return null;
        }

        const marcaEnArray = marcas.find(marca => marca.nombre.toLowerCase() === nombreMarca.toLowerCase());
        if (marcaEnArray) {
          return marcaEnArray.id;
        }

        const marcaEncontrada = await Marca.find().where({ nombre: nombreMarca, deleted: false }).limit(1);
        if (marcaEncontrada.length > 0) {
          marcas = [...marcas, { id: marcaEncontrada[0].id, nombre: marcaEncontrada[0].nombre }];
          return marcaEncontrada[0].id;
        }
        const marcaCreada = await Marca.create({ id: await sails.helpers.objectId(), nombre: nombreMarca }).fetch().usingConnection(db);

        if (!marcaCreada) {
          return proceed(new Error('Ocurrió un error al crear la marca'));
        }

        marcas = [...marcas, { id: marcaCreada.id, nombre: marcaCreada.nombre }];
        return marcaCreada.id;
      };

      const createProductos = async (productos) => {
        let productosCreados = [];
        await Producto.getDatastore().transaction(async (db, proceed) => {
          for (let i = 0; i < productos.length; i++) {
            const element = productos[i];
            const producto = {
              ...element,
              id: await sails.helpers.objectId(),
              codigo: validarCodigo(element.codigo, productosCreados),
              medida: getMedida(element.medida),
              idTipoImpuesto: await getTipoImpuesto(element.tipoImpuesto, { db, proceed }),
              idSuplidor: await getSuplidorId(element.suplidor, { db, proceed }),
              idMarca: await getMarcaId(element.marca, { db, proceed }),
            };

            const productoCreado = await Producto.create(producto).fetch().usingConnection(db);

            if (!productoCreado) {
              return proceed(new Error('Ocurrió un error al crear el producto'));
            }
            productosCreados = [...productosCreados, productoCreado];
          }

          return proceed();
        });
      };

      req.file('productos').upload({
        maxBytes: 10000000, // ajusta el límite según tus necesidades
        dirname: 'assets/temporal', // establece la ruta del directorio temporal
      }, async (err, archivos) => {
        if (err) {
          return res.serverError(err);
        }

        if (archivos.length === 0) {
          return res.badRequest('No se proporcionó ningún archivo CSV');
        }

        const csvFilePath = archivos[0].fd;
        let productosToCreate = [];
        let lineNumber = 1;

        fs.createReadStream(csvFilePath)
          .pipe(parse({ delimiter: ',' }))
          .on('data', (csvrow) => {
            if (csvrow.length !== 11) {
              console.error(`Invalid number of fields on line ${lineNumber}: ${csvrow}`);
              return; // Skip this row
            }
            // Procesa cada fila del CSV según tus necesidades
            /*
              Productos
                0: codigo
                1: descripcion,
                2: costo,
                3: precio,
                4: precioMinimo,
                5: tipoImpuesto,
                6: porcentajeImpuesto,
                7: unidadMedida,
                8: suplidor,
                9: marca,
            */
            const producto = {
              nombre: csvrow[1].trim(),
              descripcion: csvrow[1].trim(),
              codigo: csvrow[0].trim(),
              codigoExterno: csvrow[0].trim(),
              costo: parseFloat(csvrow[2].trim()),
              precio: parseFloat(csvrow[3].trim()),
              cantidad: 0,
              medida: csvrow[7].trim(),
              tipoImpuesto: csvrow[5].trim(),
              suplidor: csvrow[8].trim(),
              marca: csvrow[9].trim(),
            };

            // const productoCreado = await Producto.create(producto).fetch();
            productosToCreate = [...productosToCreate, producto];
            lineNumber++;
          })
          .on('end', async () => {
            await createProductos(productosToCreate);
            return res.ok('Lectura del CSV completada');
          });
      });
    } catch (error) {
      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al importar productos.'
      });
    }
  },
  clientes: async function (req, res) {
    try {
      const tiposNCF = [
        'facturas-de-consumo', // B02
        'factura-credito-fiscal', // B01
        'regimen-especial', // B14
        'gubernamental', // B15
        'notas-de-credito', // B04
        'comprobante-de-compra', // B11
        'gastos-menores', // B13
        'registro-unico-de-ingresos', // B12
        'notas-de-debito', // B03
        'comprobante-para-exportaciones', // B16
        'comprobante-para-pagos-al-exterior' // B17
      ];

      const clasificaciones = [
        'cooporativos',
        'tenicos',
        'familiares',
        'ocacionales',
        'gubernamentales',
        'empleados',
        'doctores',
        'empresas-relacionadas',
      ];

      const getTipoNCF = (tipoNCF) => tiposNCF[parseInt(tipoNCF) - 1] || tiposNCF[0];
      const getClasificacion = (clasificacion) => clasificaciones[parseInt(clasificacion) - 1] || clasificaciones[0];

      const crearClientes = async (clientes) => {
        let clientesCreados = [];
        await Cliente.getDatastore().transaction(async (db, proceed) => {
          for (let i = 0; i < clientes.length; i++) {
            const element = clientes[i];
            const cliente = {
              ...element,
              id: await sails.helpers.objectId(),
              idCliente: null,
              contacto: false,
            };

            const clienteCreado = await Cliente.create(cliente).fetch().usingConnection(db);

            if (!clienteCreado) {
              return proceed(new Error('Ocurrió un error al crear el cliente'));
            }
            clientesCreados = [...clientesCreados, clienteCreado];
          }

          return proceed();
        });

        return clientesCreados;
      };

      req.file('clientes').upload({
        maxBytes: 10000000, // ajusta el límite según tus necesidades (10MB por defecto)
        dirname: 'assets/temporal', // establece la ruta del directorio temporal
      }, async (err, archivos) => {
        if (err) {
          return res.serverError(err);
        }

        if (archivos.length === 0) {
          return res.badRequest('No se proporcionó ningún archivo CSV');
        }

        const csvFilePath = archivos[0].fd;
        let clientesToCreate = [];

        fs.createReadStream(csvFilePath)
          .pipe(parse({ delimiter: ',' }))
          .on('data', (csvrow) => {
            // console.log(csvrow);

            const direccion = {
              sector: csvrow[27].trim(),
              calle: csvrow[2].trim(),
              linea2direccion: '',
              ciudad: csvrow[25].trim(),
              provincia: '',
              pais: ''
            };

            const cliente = {
              nombre: csvrow[1].trim(),
              apellido: '',
              codigoExterno: csvrow[21].trim(),
              direccion,
              identificacion: csvrow[8].trim(),
              tipoIdentificacion: 'cedula',
              telefono: csvrow[6].trim(),
              celular: csvrow[7].trim(),
              email: csvrow[9].trim(),
              tipoNCF: getTipoNCF(csvrow[11].trim()),
              limiteCredito: parseFloat(csvrow[10].trim()) || 0,
              condicionCredito: parseFloat(csvrow[18].trim()) || 0,
              clasificacion: getClasificacion(csvrow[40].trim()),
            };

            // console.log(cliente);
            clientesToCreate = [...clientesToCreate, cliente];
          })
          .on('end', async () => {
            const clientes = await crearClientes(clientesToCreate);
            return res.ok({
              clientes,
              message: 'Lectura del CSV completada'
            });
          });
      });
    } catch (error) {
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al importar clientes.'
      });
    }
  },

};

