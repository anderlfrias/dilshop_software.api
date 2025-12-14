/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  'GET /': 'DocController.info',
  'GET /api': 'DocController.info',

  /***************************************************************************
  *                             CATEGORIA                                   *
  ***************************************************************************/

  'GET /api/v1/categoria': 'CategoriaController.listar',
  'GET /api/v1/categoria/:id': 'CategoriaController.obtenerPorId',
  'POST /api/v1/categoria': 'CategoriaController.crear',
  'PUT /api/v1/categoria/:id': 'CategoriaController.actualizar',
  'DELETE /api/v1/categoria/:id': 'CategoriaController.eliminar',

  /***************************************************************************
   *                            MARCA                                        *
   ***************************************************************************/

  'GET /api/v1/marca': 'MarcaController.listar',
  'GET /api/v1/marca/:id': 'MarcaController.obtenerPorId',
  'POST /api/v1/marca': 'MarcaController.crear',
  'PUT /api/v1/marca/:id': 'MarcaController.actualizar',
  'DELETE /api/v1/marca/:id': 'MarcaController.eliminar',

  /***************************************************************************
   *                           IMPUESTO                                     *
   ***************************************************************************/

  /***************************************************************************
   *                          SUPLIDOR                                       *
   ***************************************************************************/

  'GET /api/v1/suplidor': 'SuplidorController.listar',
  'GET /api/v1/suplidor/:id': 'SuplidorController.obtenerPorId',
  'POST /api/v1/suplidor': 'SuplidorController.crear',
  'PUT /api/v1/suplidor/:id': 'SuplidorController.actualizar',
  'DELETE /api/v1/suplidor/:id': 'SuplidorController.eliminar',

  /***************************************************************************
   *                         TIPO PRODUCTO                                  *
   ***************************************************************************/

  'GET /api/v1/tipoProducto': 'TipoProductoController.listar',
  'GET /api/v1/tipoProducto/:id': 'TipoProductoController.obtenerPorId',
  'POST /api/v1/tipoProducto': 'TipoProductoController.crear',
  'PUT /api/v1/tipoProducto/:id': 'TipoProductoController.actualizar',
  'DELETE /api/v1/tipoProducto/:id': 'TipoProductoController.eliminar',

  /***************************************************************************
   *                        PRODUCTO                                        *
   ***************************************************************************/

  'GET /api/v1/producto': 'ProductoController.listar',
  'GET /api/v1/producto/todos': 'ProductoController.listarTodos',
  'GET /api/v1/producto/:id': 'ProductoController.obtenerPorId',
  'GET /api/v1/producto/csv': 'ProductoController.reporteCSV',
  'POST /api/v1/producto': 'ProductoController.crear',
  'PUT /api/v1/producto/:id': 'ProductoController.actualizar',
  'DELETE /api/v1/producto/:id': 'ProductoController.eliminar',
  'PUT /api/v1/producto/aumentarCantidad/:id': 'ProductoController.aumentarCantidad',
  'PUT /api/v1/producto/DisminuirCantidad/:id': 'ProductoController.disminuirCantidad',
  'PUT /api/v1/producto/cambiarEstado/:id': 'ProductoController.cambiarEstado',

  /***************************************************************************
   *                       CLIENTE                                        *
   * *************************************************************************/

  'GET /api/v1/cliente': 'ClienteController.listar',
  'GET /api/v1/cliente/todos': 'ClienteController.listarTodos',
  'GET /api/v1/cliente/:id': 'ClienteController.obtenerPorId',
  'POST /api/v1/cliente': 'ClienteController.crear',
  'PUT /api/v1/cliente/:id': 'ClienteController.actualizar',
  'PUT /api/v1/cliente/:id/activar': 'ClienteController.activar',
  'DELETE /api/v1/cliente/:id': 'ClienteController.eliminar',

  /***************************************************************************
   *                      TIPO IMPUESTO                                     *
   * *************************************************************************/

  'GET /api/v1/tipoImpuesto': 'TipoImpuestoController.listar',
  'GET /api/v1/tipoImpuesto/:id': 'TipoImpuestoController.obtenerPorId',
  'POST /api/v1/tipoImpuesto': 'TipoImpuestoController.crear',
  'PUT /api/v1/tipoImpuesto/:id': 'TipoImpuestoController.actualizar',
  'DELETE /api/v1/tipoImpuesto/:id': 'TipoImpuestoController.eliminar',

  /***************************************************************************
   *                     CAJA                                               *
    * *************************************************************************/

  'GET /api/v1/caja': 'CajaController.listar',
  'GET /api/v1/caja/:id': 'CajaController.obtenerPorId',
  'POST /api/v1/caja': 'CajaController.crear',
  'PUT /api/v1/caja/:id': 'CajaController.actualizar',
  'DELETE /api/v1/caja/:id': 'CajaController.eliminar',

  /***************************************************************************
   *                     REGISTRO CAJA                                        *
   * *************************************************************************/

  'GET /api/v1/registroCaja': 'RegistroCajaController.listar',
  'GET /api/v1/registroCaja/estado/:estado': 'RegistroCajaController.listarPorEstado',
  'GET /api/v1/registroCaja/:id': 'RegistroCajaController.obtenerPorId',
  'GET /api/v1/registroCaja/obtenerPorUserId/:userId': 'RegistroCajaController.obtenerPorUserId',
  'POST /api/v1/registroCaja': 'RegistroCajaController.crear',
  'PUT /api/v1/registroCaja/:id': 'RegistroCajaController.actualizar',
  'DELETE /api/v1/registroCaja/:id': 'RegistroCajaController.eliminar',
  'PUT /api/v1/registroCaja/cerrar/:id': 'RegistroCajaController.cerrar',
  'PUT /api/v1/registroCaja/:id/completar': 'RegistroCajaController.completar',
  'GET /api/v1/registroCaja/:id/imprimir': 'RegistroCajaController.imprimir',

  /***************************************************************************
   *                    Pre-Factura                                        *
   * *************************************************************************/

  'GET /api/v1/preFactura': 'PreFacturaController.listar',
  'GET /api/v1/preFactura/:id': 'PreFacturaController.obtenerPorId',
  'GET /api/v1/preFactura/estado/:estado': 'PrefacturaController.obtenerPorEstado',
  'POST /api/v1/preFactura': 'PreFacturaController.crear',
  'PUT /api/v1/preFactura/:id': 'PreFacturaController.actualizar',
  'DELETE /api/v1/preFactura/:id': 'PreFacturaController.eliminar',
  'DELETE /api/v1/preFactura/anularPreFactura/:id': 'PreFacturaController.anularPreFactura',

  'POST /api/v1/preFactura/agregarProductos': 'PreFacturaController.agregarProductos',
  'POST /api/v1/preFactura/agregarProducto': 'PreFacturaController.agregarProducto',
  'DELETE /api/v1/preFactura/eliminarProducto': 'PreFacturaController.eliminarProducto',
  'GET /api/v1/preFactura/obtenerPorIdConDetalle/:id': 'PreFacturaController.obtenerPorIdConDetalle',
  'GET /api/v1/preFactura/obtenerPorIdConDetalle/:id/eliminados': 'PreFacturaController.obtenerPorIdConDetalleEliminados',
  'GET /api/v1/preFactura/listarPorRegistroCajaId/:id': 'PreFacturaController.listarPorRegistroCaja',
  'GET /api/v1/prefactura/:id/imprimir': 'PreFacturaController.imprimir',
  'GET /api/v1/prefactura/abiertas/:userId': 'PreFacturaController.obtenerAbiertasPorUserId',

  // Descuentos
  'PUT /api/v1/preFactura/:id/descuento': 'PreFacturaController.agregarDescuento',
  'DELETE /api/v1/preFactura/:id/descuento': 'PreFacturaController.eliminarDescuento',

  /***************************************************************************
   *                   Factura                                               *
   * *************************************************************************/

  'GET /api/v1/factura': 'FacturaController.listar',
  'GET /api/v1/factura/:id': 'FacturaController.obtenerPorId',
  'POST /api/v1/factura': 'FacturaController.crear',
  'PUT /api/v1/factura/:id': 'FacturaController.actualizar',
  'DELETE /api/v1/factura/:id': 'FacturaController.eliminar',

  'POST /api/v1/factura/agregarProductos': 'FacturaController.agregarProductos',
  'POST /api/v1/factura/crearFacturaConProductos/:prefacturaid': 'FacturaController.crearFacturaConProductos',
  'POST /api/v1/factura/agregarProductosPreFactura': 'FacturaController.agregarProductosPreFactura',
  'GET /api/v1/factura/obtenerPorIdConDetalle/:id': 'FacturaController.obtenerPorIdConDetalle',
  'GET /api/v1/factura/obtenerPorRegistroCaja/:registroCajaId': 'FacturaController.obtenerPorRegistroCaja',
  'GET /api/v1/factura/obtenerPorCxC/:cxcId': 'FacturaController.obtenerPorCxCId',
  'POST /api/v1/factura/abonar': 'FacturaController.cobroFactura',
  'POST /api/v1/factura/abonar-lote': 'FacturaController.cobroFacturaLote',
  'GET /api/v1/factura/imprimir/:id': 'FacturaController.imprimir',
  'PUT /api/v1/factura/:id/anular': 'FacturaController.anular',

  /***************************************************************************
   *                  Mesas                                                  *
   * *************************************************************************/

  'GET /api/v1/mesa': 'MesaController.listar',
  'GET /api/v1/mesa/:id': 'MesaController.obtenerPorId',
  'POST /api/v1/mesa': 'MesaController.crear',
  'PUT /api/v1/mesa/:id': 'MesaController.actualizar',
  'DELETE /api/v1/mesa/:id': 'MesaController.eliminar',
  'PUT /api/v1/mesa/:id/cambiarEstado': 'MesaController.cambiarEstado',

  /***************************************************************************
   *                  Cuentas por cobrar                                     *
   * *************************************************************************/
  'GET /api/v1/cxc': 'CxCController.listar',
  'GET /api/v1/cxc/:id': 'CxCController.obtenerPorId',
  'GET /api/v1/cxc/cliente/:id': 'CxCController.obtenerPorClienteId',
  'GET /api/v1/cxc/exportar-csv': 'CxCController.exportCsv',
  'GET /api/v1/cxc/lista-ids': 'CxCController.listaIds',

  /***************************************************************************
   *                  Numero de Comprobante Fiscal                           *
   * *************************************************************************/
  'GET /api/v1/ncf': 'NCFController.listar',
  'GET /api/v1/ncf/:id': 'NCFController.obtenerPorId',
  'POST /api/v1/ncf': 'NCFController.crear',
  'DELETE /api/v1/ncf/:id': 'NCFController.eliminar',

  /***************************************************************************
   *                  Ordenes                                              *
   * *************************************************************************/
  'GET /api/v1/ordenes': 'OrdenController.listar',

  /***************************************************************************
   *                  Reportes                                              *
   * *************************************************************************/
  'GET /api/v1/reporte/ventas/resumen': 'ReporteController.resumenDeVentas',
  'GET /api/v1/reporte/ventas': 'ReporteController.ventas',
  'GET /api/v1/reporte/ventas/csv': 'ReporteController.ventasCSV',
  'GET /api/v1/reporte/607': 'ReporteController.reporte607',
  'GET /api/v1/reporte/607/csv': 'ReporteController.reporte607CSV',
  'GET /api/v1/reporte/analisis-antiguedad-saldos': 'ReporteController.analisisActiguedadSaldos',

  /***************************************************************************
   *                  Importar datos                                         *
   * *************************************************************************/
  'POST /api/v1/importar/productos': 'ImportarDataController.productos',
  'POST /api/v1/importar/clientes': 'ImportarDataController.clientes',

  /***************************************************************************
   *                            Cobros                                         *
   * *************************************************************************/
  'GET /api/v1/cobros': 'CobrosController.listar',
  'GET /api/v1/cobros/csv': 'CobrosController.cobrosCSV',
  'GET /api/v1/cobros/caja': 'CobrosController.cobrosCaja',
  'GET /api/v1/cobros/caja/csv': 'CobrosController.cobrosCajaCSV',
  'GET /api/v1/cobros/nomina': 'CobrosController.cobrosNomina',
  'GET /api/v1/cobros/nomina/csv': 'CobrosController.cobrosNominaCSV',

  /***************************************************************************
   *                    Activity Logs                                         *
   * *************************************************************************/
  'GET /api/v1/logs': 'ActivityLogsController.listar',
  'GET /api/v1/logs/:id': 'ActivityLogsController.obtenerPorId',

  /***************************************************************************
   *                    Logged Users                                         *
   * *************************************************************************/
  'GET /api/v1/logged-users': 'LoggedUsersController.get',
  'DELETE /api/v1/logged-users/:id': 'LoggedUsersController.delete',
  'POST /api/v1/logged-users/:userId/login': 'LoggedUsersController.login',
  'POST /api/v1/logged-users/:userId/logout': 'LoggedUsersController.logout',


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
