import importlib.util
import io
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[2]/'scripts/dictionary/collect-nikl.py'
spec=importlib.util.spec_from_file_location('nikl',P);nikl=importlib.util.module_from_spec(spec);spec.loader.exec_module(nikl)
FIXTURE=b'<channel><total>1</total><item><target_code>123</target_code><word>test</word><sup_no>0</sup_no><pos>noun</pos><sense><sense_order>2</sense_order><definition>fixture meaning</definition></sense></item></channel>'
class NiklTests(unittest.TestCase):
    def test_xml_senses(self):
        parsed=nikl.parse_response(FIXTURE)
        self.assertEqual(parsed['entries'][0]['senses'][0]['sense_order'],2)
        self.assertNotIn('key=',parsed['entries'][0]['source_url'])
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
        self.assertNotIn(key,str(result))
        self.assertFalse(result['daily_card_promotion'])
    def test_failure_does_not_echo_key(self):
        def failed(*_a,**_k):raise OSError('a'*32)
        with self.assertRaisesRegex(nikl.NiklError,'^NIKL_NETWORK_ERROR$'):
            nikl.collect('a'*32,['마음'],opener=failed)
if __name__=='__main__':unittest.main()
