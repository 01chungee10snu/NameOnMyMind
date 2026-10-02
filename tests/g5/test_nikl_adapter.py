import importlib.util
import io
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[2]/'scripts/dictionary/collect-nikl.py'
spec=importlib.util.spec_from_file_location('nikl',P);nikl=importlib.util.module_from_spec(spec);spec.loader.exec_module(nikl)
FIXTURE=b'<channel><total>1</total><item><target_code>123</target_code><word>test</word><sup_no>0</sup_no><pos>noun</pos><sense><sense_order>2</sense_order><definition>fixture meaning</definition></sense></item></channel>'
OMITTED_SENSE_FIXTURE=b'<channel><total>2</total><item><target_code>123</target_code><word>test</word><sense><sense_order>1</sense_order><definition>kept meaning</definition></sense><sense><sense_order></sense_order><definition>missing order</definition></sense><sense><sense_order>bad</sense_order><definition>invalid order</definition></sense><sense><sense_order>3</sense_order><definition> </definition></sense></item><item><target_code>456</target_code><word>omitted</word><sense><sense_order>4</sense_order><definition> </definition></sense></item></channel>'
class NiklTests(unittest.TestCase):
    def test_xml_senses(self):
        parsed=nikl.parse_response(FIXTURE)
        self.assertEqual(parsed['entries'][0]['senses'][0]['sense_order'],2)
        self.assertNotIn('key=',parsed['entries'][0]['source_url'])
    def test_empty_definitions_are_omitted_and_invalid_orders_are_retained(self):
        parsed=nikl.parse_response(OMITTED_SENSE_FIXTURE)
        self.assertEqual(parsed['entries'][0]['senses'][0]['definition'],'kept meaning')
        missing_order_sense=parsed['entries'][0]['senses'][1]
        self.assertIsNone(missing_order_sense['sense_order'])
        self.assertEqual(missing_order_sense['sense_order_status'],'API_DID_NOT_PROVIDE_VALID_ORDER')
        self.assertIsNone(parsed['entries'][0]['senses'][2]['sense_order'])
        self.assertEqual(parsed['omitted_senses'],2)
        self.assertEqual(parsed['missing_sense_orders'],2)
        self.assertEqual(parsed['omitted_entries'],1)
    def test_invalid_total_fails_closed(self):
        with self.assertRaisesRegex(nikl.NiklError,'^INVALID_TOTAL$'):
            nikl.parse_response(b'<channel><total>-1</total></channel>')
    def test_error_and_entity_boundaries(self):
        for value in [b'<error><error_code>020</error_code><message>secret</message></error>', b'<!DOCTYPE a [<!ENTITY a "x">]><a/>', b'<x/>', b'broken']:
            with self.assertRaises(nikl.NiklError):nikl.parse_response(value)
    def test_key_missing_fails_before_network(self):
        with self.assertRaisesRegex(nikl.NiklError,'MISSING_OR_INVALID'):
            nikl.collect('', ['마음'],opener=lambda *_a,**_k:self.fail('Network called'))
    def test_mocked_collection_redacts_secret(self):
        key='a'*32
        result=nikl.collect(key,['마음'],opener=lambda *_a,**_k:io.BytesIO(FIXTURE))
        self.assertEqual(result['entry_count'],1)
        self.assertEqual(result['omitted_senses'],0)
        self.assertEqual(result['omitted_entries'],0)
        self.assertNotIn(key,str(result))
        self.assertFalse(result['daily_card_promotion'])
    def test_mocked_collection_reports_omissions(self):
        result=nikl.collect('a'*32,['마음'],opener=lambda *_a,**_k:io.BytesIO(OMITTED_SENSE_FIXTURE))
        self.assertEqual(result['entry_count'],1)
        self.assertEqual(result['omitted_senses'],2)
        self.assertEqual(result['missing_sense_orders'],2)
        self.assertEqual(result['omitted_entries'],1)
    def test_failure_does_not_echo_key(self):
        def failed(*_a,**_k):raise OSError('a'*32)
        with self.assertRaisesRegex(nikl.NiklError,'^NIKL_NETWORK_ERROR$'):
            nikl.collect('a'*32,['마음'],opener=failed)
if __name__=='__main__':unittest.main()
