import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../../../src/app.module'

jest.setTimeout(60_000)

const base = '/lis'

const resourcePayloads: Record<string, any> = {
    uoms: { code: 'UOM-TEST', name: 'Test unit', description: 'Integration test', active: true },
    'test-categories': { code: 'CAT-TEST', name: 'Test category', description: 'Integration test', active: true },
    loinc: { code: 'LOINC-TEST', name: 'Test LOINC', system: 'LOINC', component: 'Comp', property: 'Prop', scale: 'Qn', active: true },
    'sample-types': { key: 'SPT-01', name: 'Sample Type', accessionCode: 'ABC', description: 'Integration test', active: true },
    'rejection-reasons': { code: 'REJ-A1B2C3', name: 'Rejection Reason', description: 'Integration test', active: true },
    priorities: { code: 'PRI-TEST01', name: 'Priority Test', description: 'Integration test', index: 1, active: true },
    programs: { code: 'PG-TEST', name: 'Program Test', description: 'Integration test', testDefinitionIds: [] as string[], active: true },
    'location-types': { code: 'LT-TEST', name: 'Location Type Test', description: 'Integration test', allowChildren: true, allowedChildTypeIds: [], active: true },
    'attribute-definitions': { key: 'attr_test', name: 'Attribute Test', description: 'Integration test', appliesToTypeId: '', dataType: 'TEXT', required: false, active: true },
    locations: { name: 'Location Test', reference: 'LOC-TEST', typeId: '', parentId: null, active: true, attributeValues: [] },
    'test-definitions': { code: 'TD-TEST', name: 'Test Definition', description: 'Integration test', loincId: '', categoryId: '', methodology: 'M', resultType: 'NUMERIC', sampleTypeIds: [], programIds: [], uomId: '', minValue: '0', maxValue: '100', criticalMin: '1', criticalMax: '99', turnaroundTimeMinutes: 60, testDurationMinutes: 120, active: true, reportable: true },
    'reference-ranges': { testId: '', gender: 'DEFAULT', minAge: 0, maxAge: 10, lowValue: '0.1', highValue: '1.0', unitId: '', active: true, operator: 'BETWEEN', criticalLow: '0.05', criticalHigh: '1.5' },
}
const log = (res) => {
                        if (res.statusCode != 201) {
                            console.log('Response Body:', res.body);
                            console.log('Status Code:', res.status);
                        }
                    }
describe('LIS Integration (Postgres)', () => {
    let app: INestApplication
    let dataSource: DataSource
    let createdIds: Record<string, string> = {}

    beforeAll(async () => {
        process.env.DB_NAME = process.env.DB_NAME ?? 'rxsoft_lis_test'
        process.env.DB_DROP_SCHEMA = 'true'
        process.env.DB_SYNCHRONIZE = 'true'
        process.env.TYPEORM_LOGGING = 'false'
        process.env.SKIP_AUTH = 'true'

        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }))
        await app.init()
        dataSource = app.get(DataSource)
    })

    afterAll(async () => {
        if (app) {
            await app.close()
        }
        if (dataSource?.isInitialized) {
            await dataSource.destroy()
        }
    })

    it('should create and CRUD basic LIS resources', async () => {
        // create foundation resources first
        for (const resource of ['uoms', 'test-categories', 'loinc', 'sample-types', 'rejection-reasons', 'priorities']) {
            try {
                const response = await request(app.getHttpServer())
                    .post(`${base}/${resource}`)
                    .send(resourcePayloads[resource])
                    .expect(201)
                createdIds[resource] = response.body.id
                expect(response.body).toMatchObject({ ...resourcePayloads[resource], id: expect.any(String) })

            } catch (err) {
                console.error('Test Failed:', err.response?.body || err.message);
                throw err; // Re-throw so the test still fails
            }
        }

        // create program, location-type, test-definition, attribute-definition, location, reference-range
        resourcePayloads.programs.testDefinitionIds = []
        const programResp = await request(app.getHttpServer())
            .post(`${base}/programs`)
            .send(resourcePayloads.programs)
            .expect(201)
        createdIds.programs = programResp.body.id

        const locationTypeResp = await request(app.getHttpServer())
            .post(`${base}/location-types`)
            .send(resourcePayloads['location-types'])
            .expect(201)
        createdIds['location-types'] = locationTypeResp.body.id

        resourcePayloads['attribute-definitions'].appliesToTypeId = createdIds['location-types']
        const attrResp = await request(app.getHttpServer())
            .post(`${base}/attribute-definitions`)
            .send(resourcePayloads['attribute-definitions'])
            .expect(201)
        createdIds['attribute-definitions'] = attrResp.body.id

        resourcePayloads.locations.typeId = createdIds['location-types']
        const locationResp = await request(app.getHttpServer())
            .post(`${base}/locations`)
            .send(resourcePayloads.locations)
            .expect(201)
        createdIds.locations = locationResp.body.id

        resourcePayloads['test-definitions'].loincId = createdIds.loinc
        resourcePayloads['test-definitions'].categoryId = createdIds['test-categories']
        resourcePayloads['test-definitions'].uomId = createdIds.uoms
        resourcePayloads['test-definitions'].sampleTypeIds = [createdIds['sample-types']]
        resourcePayloads['test-definitions'].programIds = [createdIds.programs]
        const testDefResp = await request(app.getHttpServer())
            .post(`${base}/test-definitions`)
            .send(resourcePayloads['test-definitions'])
            .expect(201)
        createdIds['test-definitions'] = testDefResp.body.id

        resourcePayloads['reference-ranges'].testId = createdIds['test-definitions']
        resourcePayloads['reference-ranges'].unitId = createdIds.uoms
        const refRangeResp = await request(app.getHttpServer())
            .post(`${base}/reference-ranges`)
            .send(resourcePayloads['reference-ranges'])
            .expect(201)
        createdIds['reference-ranges'] = refRangeResp.body.id

        // list and get each resource
        for (const resource of Object.keys(resourcePayloads)) {
            console.log('Listing resource:', resource)
            const listRes = await request(app.getHttpServer()).get(`${base}/${resource}`).expect(log).expect(200)
            expect(listRes.body.data.length).toBeGreaterThanOrEqual(1)

            const id = createdIds[resource]
            if (id) {
                const getRes = await request(app.getHttpServer()).get(`${base}/${resource}/${id}`).expect(200)
                expect(getRes.body.id).toEqual(id)
            }
        }

        // update a few resources
        await request(app.getHttpServer())
            .patch(`${base}/uoms/${createdIds.uoms}`)
            .send({ name: 'Updated UOM' })
            .expect(200)

        await request(app.getHttpServer())
            .patch(`${base}/test-categories/${createdIds['test-categories']}`)
            .send({ name: 'Updated Category' })
            .expect(200)

        const updatedTest = await request(app.getHttpServer())
            .patch(`${base}/test-definitions/${createdIds['test-definitions']}`)
            .send({ name: 'Updated Test Definition' })
            .expect(200)
        expect(updatedTest.body.name).toEqual('Updated Test Definition')

        // archive a resource
        await request(app.getHttpServer())
            .delete(`${base}/rejection-reasons/${createdIds['rejection-reasons']}`)
            .expect(200)

        await request(app.getHttpServer())
            .get(`${base}/rejection-reasons/${createdIds['rejection-reasons']}`)
            .expect(404)
    })
})
