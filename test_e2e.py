import urllib.request
import json
import os

def test_inference(wav_file):
    boundary = '----WebKitFormBoundaryCardioLensTest'
    wav_path = os.path.join('training_data', 'training_data', wav_file)
    with open(wav_path, 'rb') as f:
        audio_content = f.read()

    header = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="audio"; filename="{wav_file}"\r\n'
        'Content-Type: audio/wav\r\n\r\n'
    ).encode('utf-8')
    footer = f'\r\n--{boundary}--\r\n'.encode('utf-8')
    body = header + audio_content + footer

    req = urllib.request.Request(
        'http://localhost:5173/api/predict',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    print(f'Test {wav_file}:')
    print('  Prediction:', data['prediction']['label'])
    print('  Confidence:', data['prediction']['confidence_percentage'], '%')
    print('  Probabilities:', data['prediction']['probabilities'])
    print('  Inference Time:', data['processing_time_ms'], 'ms')
    return data

def test_pdf_generation(analysis_data):
    body = json.dumps(analysis_data).encode('utf-8')
    req = urllib.request.Request(
        'http://localhost:5173/api/generate-report',
        data=body,
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    pdf_bytes = res.read()
    print('PDF Generation via proxy (5173 -> 5000):')
    print('  Status:', res.status)
    print('  Content-Type:', res.headers.get('Content-Type'))
    print('  PDF Header:', pdf_bytes[:5])
    print('  PDF Size:', len(pdf_bytes), 'bytes')

if __name__ == '__main__':
    data1 = test_inference('14241_AV.wav')
    print()
    data2 = test_inference('13918_AV.wav')
    print()
    test_pdf_generation(data2)
