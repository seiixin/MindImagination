import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function FrontPageSlides() {
  const [slides, setSlides] = useState([
    { id: 1, imageFile: null, imageName: '', details: '' },
    { id: 2, imageFile: null, imageName: '', details: '' },
  ]);

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now(),
      imageFile: null,
      imageName: '',
      details: '',
    };
    setSlides([...slides, newSlide]);
  };

  const handleRemoveSlide = (id) => {
    setSlides(slides.filter((slide) => slide.id !== id));
  };

  const handleImageChange = (id, file) => {
    const updatedSlides = slides.map((slide) =>
      slide.id === id
        ? { ...slide, imageFile: file, imageName: file?.name || '' }
        : slide
    );
    setSlides(updatedSlides);
  };

  const handleDetailsChange = (id, value) => {
    const updatedSlides = slides.map((slide) =>
      slide.id === id ? { ...slide, details: value } : slide
    );
    setSlides(updatedSlides);
  };

  const handleSaveChanges = () => {
    console.log('Saving slides:', slides);
    alert('Changes saved (mock)');
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto px-6 py-8 bg-gray-200 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-700 uppercase tracking-wider">
          Front Page Slide Show Settings
        </h1>

        {/* Add Slide Button */}
        <div>
          <button
            onClick={handleAddSlide}
            className={`px-6 py-2 rounded-full bg-gray-200 font-semibold uppercase ${neuShadow} hover:brightness-95 transition`}
          >
            Add Slide
          </button>
        </div>

        {/* Slide Items */}
        <div className="space-y-10">
          {slides.map((slide, index) => (
            <div key={slide.id} className={`p-6 rounded-xl bg-gray-200 ${neuShadow} space-y-6`}>
              <h2 className="text-lg font-semibold text-gray-800 uppercase">
                Slide Show {index + 1}
              </h2>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Image:</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(slide.id, e.target.files[0])}
                    className="text-sm"
                  />
                  <span className="text-sm text-gray-500">
                    {slide.imageName || 'No file chosen'}
                  </span>
                </div>
              </div>

              {/* Details Textarea */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Details:</label>
                <textarea
                  rows="3"
                  placeholder="Enter slide details..."
                  value={slide.details}
                  onChange={(e) => handleDetailsChange(slide.id, e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-200 outline-none text-sm ${neuShadow}`}
                ></textarea>
              </div>

              {/* Remove Button */}
              <div>
                <button
                  onClick={() => handleRemoveSlide(slide.id)}
                  className={`px-6 py-2 rounded-full font-semibold uppercase text-red-700 bg-red-100 hover:bg-red-200 transition ${neuShadow}`}
                >
                  Remove Slide
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Changes */}
        <div className="pt-6">
          <button
            onClick={handleSaveChanges}
            className={`w-full py-4 rounded-full font-bold text-lg uppercase bg-gray-200 text-gray-800 ${neuShadow} hover:brightness-95 transition`}
          >
            Save All Changes
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
