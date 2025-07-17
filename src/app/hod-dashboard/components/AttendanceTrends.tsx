'use client';

export default function AttendanceTrends() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Attendance Trends</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">This Month</button>
          <button className="px-3 py-1 text-xs font-medium rounded text-gray-600 hover:bg-gray-100">Last Month</button>
        </div>
      </div>

      <div className="h-64 flex items-center justify-center">
        {/* This would be replaced with an actual chart component */}
        <div className="flex h-full w-full items-end justify-between space-x-2 px-4">
          <div className="flex flex-col items-center">
            <div className="w-8 bg-blue-500 rounded-t" style={{ height: '60%' }}></div>
            <span className="text-xs mt-1">Week 1</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 bg-blue-500 rounded-t" style={{ height: '75%' }}></div>
            <span className="text-xs mt-1">Week 2</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 bg-blue-500 rounded-t" style={{ height: '90%' }}></div>
            <span className="text-xs mt-1">Week 3</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
            <span className="text-xs mt-1">Week 4</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 bg-blue-500 rounded-t" style={{ height: '95%' }}></div>
            <span className="text-xs mt-1">Week 5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
