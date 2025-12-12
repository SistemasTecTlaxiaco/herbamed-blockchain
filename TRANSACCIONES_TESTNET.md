# Estado de Transacciones en Testnet (Soroban)

**Fecha:** 12 de Diciembre, 2025  
**Contrato:** CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR

## Cuentas Utilizadas

### Vendor (GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL)
- Fondeo: hash `695099a468bfd0ebe564341a5c9ef03590d644fe5984cc9f2a050a98ac5faf15`
- Plantas: D-LAVANDA-002, D-JENGIBRE-006

### Buyer (GA2JBPZ6PBRBZEDXKKMFMV3LRFARBWZ4UXG4OJPVLNXRDZPV4GBSSFTV)
- Fondeo: hash `9da6f8ec557db6362483d39192e4ac54e53039482c43ca6384a8c03070035e1e`
- Plantas: D-EUCALIPTO-007, D-CEDRON-010

## Transacciones Completadas

### Registros de Plantas

1. **D-EUCALIPTO-007** (Buyer)
   - Hash: `3487ef4aa10d328a5c63ba7a96db02609224ff2e8de4e682c75a33717b34dac1`
   - Estado: ✅ SUCCESS
   - [Ver en Stellar Expert](https://stellar.expert/explorer/testnet/tx/3487ef4aa10d328a5c63ba7a96db02609224ff2e8de4e682c75a33717b34dac1)

2. **D-CEDRON-010** (Buyer)
   - Hash: `8e9d507b1ba02530801599c7f368d9116111101dd297fc31d8ba4e298bf01eb4`
   - Estado: ✅ SUCCESS
   - [Ver en Stellar Expert](https://stellar.expert/explorer/testnet/tx/8e9d507b1ba02530801599c7f368d9116111101dd297fc31d8ba4e298bf01eb4)

### Listings (Publicación en Marketplace)

1. **D-EUCALIPTO-007** a 12 XLM (Buyer)
   - Hash: `c4985c859cabc6d402ca4f50f1fb79c90ede4d5ac67fd1c2ef05fc9d354399c1`
   - Estado: ✅ SUCCESS

2. **D-CEDRON-010** a 18 XLM (Buyer)
   - Hash: `cf4f9adb028d12ef799775824b9072c96e02c9271d7662dba0c79f075838f2bf`
   - Estado: ✅ SUCCESS

3. **D-LAVANDA-002** a 15 XLM (Vendor)
   - Hash: `f663c316815ea6acd2d1ad15903522f14e5aa5fe07f6dac7c10caa363f385b24`
   - Estado: ✅ SUCCESS

### Compras (Cross-Buy entre Vendor y Buyer)

1. **Buyer compra D-JENGIBRE-006** (de Vendor)
   - Hash: `dc7da59da506ecffcc2ff1721ffe0613c9366457ec8109b8dfe9d054544eaa67`
   - Estado: ✅ SUCCESS
   - Precio: 20 XLM

2. **Vendor compra D-CEDRON-010** (de Buyer)
   - Hash: `450da495c3caf0ff51c9b73ab119301fb49a350532c39fbf343f7f6e842ba5fc`
   - Estado: ✅ SUCCESS
   - Precio: 18 XLM

### Votos de Validación

1. **Vendor vota por D-EUCALIPTO-007**
   - Hash: `f7c15cceb7e7fe8d0455025b89b351a3085555f82a01c55b7165a6fedd8926ec`
   - Estado: ✅ SUCCESS

2. **Vendor vota por D-CEDRON-010**
   - Hash: `ec8d2185dddb252b66877eae20456d83d29e87c07516099d0a7be687506127bf`
   - Estado: ✅ SUCCESS

## Transacciones Pendientes/Fallidas

### Votos de Buyer (Fallidos por falta de fondos inicial)
- ⚠️ D-LAVANDA-002: Fallido (cuenta sin fondos en momento de ejecución)
- ⚠️ D-JENGIBRE-006: Fallido (cuenta sin fondos en momento de ejecución)

**Nota:** Estas se pueden reintentar ahora que la cuenta buyer está fondeada.

### Listings Pendientes de Vendor
- ⏳ D-JENGIBRE-006: No listado aún (script abortó antes)

## Problemas Identificados

### 1. Contrato Desplegado es Versión Antigua
El contrato en testnet `CA5C74SZ...XNPR` **NO** tiene el método `get_all_listings` implementado, aunque el código fuente actual sí lo incluye.

**Error al llamar get_all_listings:**
```
HostError: Error(WasmVm, MissingValue)
"trying to invoke non-existent contract function", get_all_listings
```

### 2. Soluciones Propuestas

#### Opción A: Redesplegar Contrato Actualizado
```bash
cd /home/ricardo_1/herbamed-blockchain
soroban contract build
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/medicinal_plants.wasm --source-account VENDOR_SECRET --network testnet
```

#### Opción B: Adaptar UI para Trabajar Sin `get_all_listings`
- Usar solo defaults locales (`defaultSeeds.js`)
- Consultar plantas individuales con `getPlant()`
- Mostrar estado basado en datos locales + consultas individuales

#### Opción C: Modo Híbrido (Actual)
- UI combina defaults locales con datos de blockchain
- Auto-refresh mediante `dataVersion` en Vuex
- Plantas defaults muestran datos locales hasta que se confirmen en chain

## Estado Actual de la UI

### Datos Esperados en Marketplace

#### Para Vendor (GA25G...)
- **Mis Plantas Registradas:** D-LAVANDA-002
- **Mis Listings Activos:** D-LAVANDA-002 (15 XLM)
- **Mis Compras:** D-CEDRON-010 (comprado de buyer por 18 XLM)

#### Para Buyer (GA2JB...)
- **Mis Plantas Registradas:** D-EUCALIPTO-007, D-CEDRON-010
- **Mis Listings Activos:** D-EUCALIPTO-007 (12 XLM)
- **Mis Compras:** D-JENGIBRE-006 (comprado de vendor por 20 XLM)

### Datos Esperados en Validator Dashboard

#### Para Vendor (GA25G...)
- **Votos Emitidos:** D-EUCALIPTO-007, D-CEDRON-010

#### Para Buyer (GA2JB...)
- **Votos Emitidos:** Ninguno aún (pendientes de reintentar)

## Próximos Pasos

1. ✅ **Fondear cuentas** - COMPLETADO
2. ⏳ **Decidir estrategia**: ¿Redesplegar contrato o usar modo híbrido?
3. ⏳ **Completar seeding**: Listar D-JENGIBRE-006, votos de buyer
4. ⏳ **Verificar UI**: Arrancar dev server y confirmar visualización correcta
5. ⏳ **Actualizar defaultSeeds.js**: Incluir hashes reales de transacciones

## Verificación en Stellar Expert

Todas las transacciones se pueden verificar en:
```
https://stellar.expert/explorer/testnet/tx/<HASH>
```

Ejemplo:
- [Compra de Jengibre](https://stellar.expert/explorer/testnet/tx/dc7da59da506ecffcc2ff1721ffe0613c9366457ec8109b8dfe9d054544eaa67)
- [Compra de Cedrón](https://stellar.expert/explorer/testnet/tx/450da495c3caf0ff51c9b73ab119301fb49a350532c39fbf343f7f6e842ba5fc)
