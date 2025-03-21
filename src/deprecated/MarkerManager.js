import React from 'react';

const MarkerManager = ({ markers, onDeleteMarker, onSaveMarker }) => {
  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">마커 관리</h3>
      
      {markers.length === 0 ? (
        <p className="text-gray-500">저장된 마커가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {markers.map((marker, index) => (
            <div key={index} className="border rounded-md p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">마커 #{index + 1}</p>
                <p className="text-sm text-gray-600">위도: {marker.lat.toFixed(6)}</p>
                <p className="text-sm text-gray-600">경도: {marker.lng.toFixed(6)}</p>
              </div>
              <button
                onClick={() => onDeleteMarker(index)}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onSaveMarker}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          현재 마커 저장
        </button>
      </div>
    </div>
  );
};

export default MarkerManager; 